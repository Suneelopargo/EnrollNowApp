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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import java.util.function.Supplier;

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
    private final TransactionTemplate transactionTemplate;

    @Autowired
    public OutboxEventProcessor(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            @Autowired(required = false) OutboxEventClaimService claimService,
            @Autowired(required = false) PlatformTransactionManager transactionManager) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
        this.notificationDispatcher = notificationDispatcher;
        this.claimService = claimService;
        this.heartbeatExecutor = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "outbox-heartbeat-worker");
            t.setDaemon(true);
            return t;
        });
        if (transactionManager != null) {
            TransactionTemplate tt = new TransactionTemplate(transactionManager);
            tt.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            this.transactionTemplate = tt;
        } else {
            this.transactionTemplate = null;
        }
    }

    public OutboxEventProcessor(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            OutboxEventClaimService claimService) {
        this(outboxRepository, attemptRepository, notificationDispatcher, claimService, null);
    }

    public OutboxEventProcessor(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher) {
        this(outboxRepository, attemptRepository, notificationDispatcher, null, null);
    }

    @PreDestroy
    public void shutdown() {
        try {
            heartbeatExecutor.shutdownNow();
        } catch (Exception ignored) {
        }
    }

    private <T> T executeInShortTransaction(Supplier<T> action) {
        if (transactionTemplate != null) {
            return transactionTemplate.execute(status -> action.get());
        }
        return action.get();
    }

    private void runInShortTransaction(Runnable action) {
        if (transactionTemplate != null) {
            transactionTemplate.executeWithoutResult(status -> action.run());
        } else {
            action.run();
        }
    }

    /**
     * Processes a single claimed outbox event.
     * External email delivery (SendGrid/SMTP/Graph) is explicitly separated from database transactions:
     * 1. Short Transaction 1: Load and validate event ownership.
     * 2. Non-Transactional: Dispatch notification with recurring heartbeat lease renewal.
     * 3. Non-Transactional: Independent recipient delivery tracking commits each recipient in REQUIRES_NEW.
     * 4. Short Transaction 2: Re-verify lease ownership and commit final PUBLISHED or FAILED status.
     */
    public void processSingleEvent(UUID eventId, String workerId) {
        // Step 1: Load and validate ownership in a short transaction
        OutboxEventEntity event = executeInShortTransaction(() -> {
            Optional<OutboxEventEntity> eventOpt = outboxRepository.findById(eventId);
            if (eventOpt.isEmpty()) {
                log.warn("Outbox event not found: {}", eventId);
                return null;
            }

            OutboxEventEntity e = eventOpt.get();
            if ("PUBLISHED".equals(e.getStatus())) {
                log.debug("Outbox event {} is already published, skipping", eventId);
                return null;
            }

            // Safe lease ownership validation: verify the event is still PROCESSING and belongs to this worker
            if (!"PROCESSING".equals(e.getStatus()) || !Objects.equals(workerId, e.getLockedBy())) {
                log.warn("Outbox event {} is not in PROCESSING state or does not belong to worker {} (status: {}, lockedBy: {}). Aborting to prevent duplicate execution.",
                        eventId, workerId, e.getStatus(), e.getLockedBy());
                return null;
            }
            return e;
        });

        if (event == null) {
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

        // Step 2 & 3: Perform notification dispatch outside a database transaction
        boolean dispatchSucceeded = false;
        Exception dispatchError = null;

        try {
            if (leaseLost.get()) {
                throw new IllegalStateException("Worker ownership lost before dispatch for event: " + eventId);
            }

            notificationDispatcher.dispatch(event);

            if (leaseLost.get()) {
                throw new IllegalStateException("Worker ownership lost during dispatch for event: " + eventId);
            }

            // Verify lease ownership before proceeding to commit
            boolean isStillOwner = claimService == null || claimService.isLeaseValid(eventId, workerId);
            if (!isStillOwner) {
                log.warn("Worker {} lost ownership of event {} before committing PUBLISHED status.", workerId, eventId);
                return;
            }

            dispatchSucceeded = true;
        } catch (Exception ex) {
            dispatchError = ex;
            log.error("Failed processing outbox event id {} [type: {}]: {}",
                    event.getId(), event.getEventType(), ex.getMessage(), ex);
        } finally {
            if (heartbeatTask != null) {
                heartbeatTask.cancel(true);
            }
        }

        // Step 4: Persist final event and attempt status in a short transaction
        final boolean success = dispatchSucceeded;
        final Exception finalError = dispatchError;

        runInShortTransaction(() -> {
            // Re-validate ownership inside the final short transaction
            boolean isStillOwner = claimService == null || claimService.isLeaseValid(eventId, workerId);
            if (!isStillOwner) {
                log.warn("Worker {} lost ownership of event {} during final transaction. Aborting write to prevent overwriting newer worker.",
                        workerId, eventId);
                return;
            }

            Optional<OutboxEventEntity> currentOpt = outboxRepository.findById(eventId);
            if (currentOpt.isEmpty()) {
                return;
            }
            OutboxEventEntity current = currentOpt.get();
            if (!"PROCESSING".equals(current.getStatus()) || !Objects.equals(workerId, current.getLockedBy())) {
                log.warn("Worker {} lost PROCESSING ownership on event {} (current status: {}, lockedBy: {}). Discarding final write.",
                        workerId, eventId, current.getStatus(), current.getLockedBy());
                return;
            }

            if (success) {
                current.setStatus("PUBLISHED");
                current.setPublishedAt(Instant.now());
                current.setLastError(null);
                current.setLockedAt(null);
                current.setLockedBy(null);

                attempt.setStatus("SUCCESS");
                attempt.setCompletedAt(Instant.now());
                log.info("Outbox event [{}] id {} published successfully on attempt {}",
                        current.getEventType(), current.getId(), currentAttempt);
            } else {
                Exception ex = finalError;
                boolean isNonRetryable = (ex instanceof IllegalArgumentException) || (ex instanceof UnsupportedOperationException);

                int retries = current.getRetryCount() + 1;
                current.setRetryCount(retries);
                current.setFailedAt(Instant.now());
                current.setLastError(ex != null ? ex.getMessage() : "Unknown dispatch error");
                current.setLockedAt(null);
                current.setLockedBy(null);

                if (isNonRetryable || retries >= MAX_RETRIES) {
                    current.setStatus("DEAD_LETTER");
                    log.warn("Outbox event {} marked DEAD_LETTER: {}", eventId, ex != null ? ex.getMessage() : "retries exceeded");
                } else {
                    current.setStatus("FAILED");
                    long delaySeconds = BASE_DELAY_SECONDS * (1L << Math.min(retries - 1, 8));
                    long jitterSeconds = ThreadLocalRandom.current().nextLong(1, 10);
                    Instant nextAvailable = Instant.now().plusSeconds(delaySeconds + jitterSeconds);
                    current.setAvailableAt(nextAvailable);
                    log.info("Rescheduled outbox event {} for retry {} at {} (backoff + jitter: {}s)",
                            eventId, retries, nextAvailable, delaySeconds + jitterSeconds);
                }

                attempt.setStatus("FAILED");
                attempt.setCompletedAt(Instant.now());
                attempt.setErrorMessage(ex != null ? ex.getMessage() : "Unknown error");
            }

            attemptRepository.saveAndFlush(attempt);
            outboxRepository.saveAndFlush(current);
        });
    }
}
