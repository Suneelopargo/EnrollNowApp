package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Dedicated Spring-managed service handling transactional lease claiming and stale recovery
 * for outbox events. Each method runs in an isolated REQUIRES_NEW transaction so that
 * locks and status updates commit before external dispatch processing commences.
 */
@Service
public class OutboxEventClaimService {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventClaimService.class);

    private final OutboxEventEntityRepository outboxRepository;

    @Autowired
    public OutboxEventClaimService(OutboxEventEntityRepository outboxRepository) {
        this.outboxRepository = outboxRepository;
    }

    /**
     * Atomically claims eligible pending/retryable outbox events using PostgreSQL FOR UPDATE SKIP LOCKED.
     * Marks claimed events as PROCESSING with locked_at and locked_by in an independent transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<UUID> claimBatch(Instant now, int maxRetries, int batchSize, String instanceId) {
        List<OutboxEventEntity> pendingEvents = outboxRepository.claimPendingEventsForUpdate(now, maxRetries, batchSize);
        if (pendingEvents == null || pendingEvents.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> claimedIds = new ArrayList<>();
        Instant lockTimestamp = Instant.now();
        for (OutboxEventEntity event : pendingEvents) {
            event.setStatus("PROCESSING");
            event.setLockedAt(lockTimestamp);
            event.setLockedBy(instanceId);
            outboxRepository.save(event);
            claimedIds.add(event.getId());
        }
        outboxRepository.flush();
        log.debug("Worker [{}] claimed {} outbox events in committed transaction", instanceId, claimedIds.size());
        return claimedIds;
    }

    /**
     * Recovers stale PROCESSING leases that exceeded leaseDuration without completing or heartbeat.
     * Runs in an independent transaction to safely unlock stuck events for retry or DEAD_LETTER.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recoverStaleLeases(Duration leaseDuration, int batchSize, int maxRetries) {
        try {
            Instant leaseThreshold = Instant.now().minus(leaseDuration);
            List<OutboxEventEntity> staleEvents = outboxRepository.findStaleProcessingEvents(leaseThreshold, batchSize);
            if (staleEvents == null || staleEvents.isEmpty()) {
                return;
            }

            log.warn("Detected {} stale PROCESSING outbox events locked before {}", staleEvents.size(), leaseThreshold);
            for (OutboxEventEntity event : staleEvents) {
                // Ensure event is still in PROCESSING state and was not renewed
                if (!"PROCESSING".equals(event.getStatus()) || event.getLockedAt() == null || event.getLockedAt().isAfter(leaseThreshold)) {
                    continue;
                }

                int retries = event.getRetryCount() + 1;
                event.setRetryCount(retries);
                event.setLockedAt(null);
                event.setLockedBy(null);
                event.setLastError("Lease expired: worker node timed out or restarted");

                if (retries >= maxRetries) {
                    event.setStatus("DEAD_LETTER");
                    log.warn("Stale event {} exceeded max retries ({}), moved to DEAD_LETTER", event.getId(), maxRetries);
                } else {
                    event.setStatus("FAILED");
                    event.setAvailableAt(Instant.now().plusSeconds(30));
                    log.info("Reset stale event {} to FAILED for retry", event.getId());
                }
                outboxRepository.save(event);
            }
            outboxRepository.flush();
        } catch (Exception e) {
            log.error("Failed during stale outbox lease recovery: {}", e.getMessage(), e);
        }
    }

    /**
     * Heartbeat extension to prolong the lease of an actively processing event so stale recovery
     * will not reclaim it during long-running dispatch tasks.
     * Uses atomic UPDATE to renew locked_at without holding long-lived row locks.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean extendLease(UUID eventId, String workerId) {
        try {
            int updated = outboxRepository.renewLease(eventId, workerId, Instant.now());
            if (updated > 0) {
                log.debug("Heartbeat extended lease for event {} by worker {}", eventId, workerId);
                return true;
            }
        } catch (Exception e) {
            log.warn("Could not execute renewLease query for event {}: {}", eventId, e.getMessage());
        }

        // Fallback check
        Optional<OutboxEventEntity> opt = outboxRepository.findById(eventId);
        if (opt.isPresent()) {
            OutboxEventEntity event = opt.get();
            if ("PROCESSING".equals(event.getStatus()) && workerId.equals(event.getLockedBy())) {
                event.setLockedAt(Instant.now());
                outboxRepository.saveAndFlush(event);
                log.debug("Extended lease for event {} by worker {}", eventId, workerId);
                return true;
            }
        }
        return false;
    }

    /**
     * Validates that the event is still in PROCESSING status and owned by the specified worker.
     */
    @Transactional(readOnly = true)
    public boolean isLeaseValid(UUID eventId, String workerId) {
        try {
            return outboxRepository.isLeaseValid(eventId, workerId);
        } catch (Exception e) {
            Optional<OutboxEventEntity> opt = outboxRepository.findById(eventId);
            return opt.isPresent()
                    && "PROCESSING".equals(opt.get().getStatus())
                    && workerId.equals(opt.get().getLockedBy());
        }
    }
}
