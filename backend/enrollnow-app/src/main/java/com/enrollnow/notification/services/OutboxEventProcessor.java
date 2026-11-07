package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventAttemptEntity;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OutboxEventProcessor {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventProcessor.class);
    public static final int MAX_RETRIES = 5;
    private static final long BASE_DELAY_SECONDS = 30L;

    private final OutboxEventEntityRepository outboxRepository;
    private final OutboxEventAttemptEntityRepository attemptRepository;
    private final NotificationDispatcher notificationDispatcher;

    @Autowired
    public OutboxEventProcessor(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
        this.notificationDispatcher = notificationDispatcher;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSingleEvent(UUID eventId, String workerId) {
        Optional<OutboxEventEntity> eventOpt = outboxRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            log.warn("Outbox event not found: {}", eventId);
            return;
        }

        OutboxEventEntity event = eventOpt.get();
        if ("PUBLISHED".equals(event.getStatus())) {
            log.debug("Outbox event {} is already published, skipping", eventId);
            return;
        }

        int currentAttempt = event.getRetryCount() + 1;

        OutboxEventAttemptEntity attempt = new OutboxEventAttemptEntity();
        attempt.setTenantId(event.getTenantId());
        attempt.setOutboxEventId(event.getId());
        attempt.setAttemptNumber(currentAttempt);
        attempt.setProcessor(workerId);
        attempt.setStartedAt(Instant.now());

        try {
            notificationDispatcher.dispatch(event);

            event.setStatus("PUBLISHED");
            event.setPublishedAt(Instant.now());
            event.setLastError(null);

            attempt.setStatus("SUCCESS");
            attempt.setCompletedAt(Instant.now());
            log.info("Outbox event [{}] id {} published successfully on attempt {}",
                    event.getEventType(), event.getId(), currentAttempt);
        } catch (Exception ex) {
            log.error("Failed processing outbox event id {} [type: {}]: {}",
                    event.getId(), event.getEventType(), ex.getMessage(), ex);

            int retries = event.getRetryCount() + 1;
            event.setRetryCount(retries);
            event.setFailedAt(Instant.now());
            event.setLastError(ex.getMessage());

            if (retries >= MAX_RETRIES) {
                event.setStatus("DEAD_LETTER");
                log.warn("Outbox event {} exceeded max retries ({}), moved to DEAD_LETTER", eventId, MAX_RETRIES);
            } else {
                event.setStatus("FAILED");
                long delaySeconds = BASE_DELAY_SECONDS * (1L << Math.min(retries - 1, 8));
                long jitterSeconds = ThreadLocalRandom.current().nextLong(1, 10);
                Instant nextAvailable = Instant.now().plusSeconds(delaySeconds + jitterSeconds);
                event.setAvailableAt(nextAvailable);
                log.info("Rescheduled outbox event {} for retry {} at {} (backoff + jitter: {}s)",
                        eventId, retries, nextAvailable, delaySeconds + jitterSeconds);
            }

            attempt.setStatus("FAILED");
            attempt.setCompletedAt(Instant.now());
            attempt.setErrorMessage(ex.getMessage());
        } finally {
            try {
                attemptRepository.saveAndFlush(attempt);
                outboxRepository.saveAndFlush(event);
            } catch (Exception persistenceEx) {
                log.error("Failed to persist outbox event attempt/state: {}", persistenceEx.getMessage(), persistenceEx);
            }
        }
    }
}
