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
import java.util.Objects;
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
    private final OutboxEventClaimService claimService;

    @Autowired
    public OutboxEventProcessor(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            @Autowired(required = false) OutboxEventClaimService claimService) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
        this.notificationDispatcher = notificationDispatcher;
        this.claimService = claimService;
    }

    public OutboxEventProcessor(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher) {
        this(outboxRepository, attemptRepository, notificationDispatcher, null);
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

        // Safe lease ownership validation: verify the event is still PROCESSING and belongs to this worker
        if (!"PROCESSING".equals(event.getStatus()) || !Objects.equals(workerId, event.getLockedBy())) {
            log.warn("Outbox event {} is not in PROCESSING state or does not belong to worker {} (status: {}, lockedBy: {}). Aborting to prevent duplicate execution.",
                    eventId, workerId, event.getStatus(), event.getLockedBy());
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
            // Heartbeat lease touch if claimService is available
            if (claimService != null) {
                claimService.extendLease(eventId, workerId);
            }

            notificationDispatcher.dispatch(event);

            event.setStatus("PUBLISHED");
            event.setPublishedAt(Instant.now());
            event.setLastError(null);
            event.setLockedAt(null);
            event.setLockedBy(null);

            attempt.setStatus("SUCCESS");
            attempt.setCompletedAt(Instant.now());
            log.info("Outbox event [{}] id {} published successfully on attempt {}",
                    event.getEventType(), event.getId(), currentAttempt);
        } catch (Exception ex) {
            log.error("Failed processing outbox event id {} [type: {}]: {}",
                    event.getId(), event.getEventType(), ex.getMessage(), ex);

            boolean isNonRetryable = (ex instanceof IllegalArgumentException) || (ex instanceof UnsupportedOperationException);

            int retries = event.getRetryCount() + 1;
            event.setRetryCount(retries);
            event.setFailedAt(Instant.now());
            event.setLastError(ex.getMessage());
            event.setLockedAt(null);
            event.setLockedBy(null);

            if (isNonRetryable || retries >= MAX_RETRIES) {
                event.setStatus("DEAD_LETTER");
                log.warn("Outbox event {} marked DEAD_LETTER: {}", eventId, ex.getMessage());
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
