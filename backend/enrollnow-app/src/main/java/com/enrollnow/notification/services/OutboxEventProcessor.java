package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventAttemptEntity;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import jakarta.annotation.PreDestroy;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class OutboxEventProcessor {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventProcessor.class);
    public static final int MAX_RETRIES = 5;
    private static final long BASE_DELAY_SECONDS = 30L;
    private static final long HEARTBEAT_INTERVAL_SECONDS = 15L;

    private final OutboxEventEntityRepository outboxRepository;
    private final OutboxEventAttemptEntityRepository attemptRepository;
    private final NotificationDispatcher notificationDispatcher;
    private final OutboxEventClaimService claimService;
    private final ScheduledExecutorService heartbeatExecutor;

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
        this.heartbeatExecutor = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "outbox-heartbeat-worker");
            t.setDaemon(true);
            return t;
        });
    }

    public OutboxEventProcessor(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher) {
        this(outboxRepository, attemptRepository, notificationDispatcher, null);
    }

    @PreDestroy
    public void shutdown() {
        try {
            heartbeatExecutor.shutdownNow();
        } catch (Exception ignored) {
        }
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

        AtomicBoolean leaseLost = new AtomicBoolean(false);
        ScheduledFuture<?> heartbeatTask = null;

        // Start recurring heartbeat lease extension for long-running operations
        if (claimService != null) {
            heartbeatTask = heartbeatExecutor.scheduleAtFixedRate(() -> {
                try {
                    boolean renewed = claimService.extendLease(eventId, workerId);
                    if (!renewed) {
                        log.warn("Lease renewal failed for event {} by worker {}. Lease lost.", eventId, workerId);
                        leaseLost.set(true);
                    }
                } catch (Exception ex) {
                    log.error("Error during lease renewal heartbeat for event {}: {}", eventId, ex.getMessage());
                    leaseLost.set(true);
                }
            }, HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_INTERVAL_SECONDS, TimeUnit.SECONDS);
        }

        try {
            if (leaseLost.get()) {
                throw new IllegalStateException("Worker ownership lost before dispatch for event: " + eventId);
            }

            notificationDispatcher.dispatch(event);

            if (leaseLost.get()) {
                throw new IllegalStateException("Worker ownership lost during dispatch for event: " + eventId);
            }

            // Verify lease ownership in database before final completion
            boolean isStillOwner = claimService == null || claimService.isLeaseValid(eventId, workerId);
            if (!isStillOwner) {
                log.warn("Worker {} lost ownership of event {} before committing PUBLISHED status.", workerId, eventId);
                return;
            }

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
            if (heartbeatTask != null) {
                heartbeatTask.cancel(true);
            }
            try {
                // Only persist attempt and event state if lease was not stolen by another worker
                if (!leaseLost.get() || !"PROCESSING".equals(event.getStatus())) {
                    attemptRepository.saveAndFlush(attempt);
                    outboxRepository.saveAndFlush(event);
                }
            } catch (Exception persistenceEx) {
                log.error("Failed to persist outbox event attempt/state: {}", persistenceEx.getMessage(), persistenceEx);
            }
        }
    }
}
