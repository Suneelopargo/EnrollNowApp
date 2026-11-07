package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventRecipientEntity;
import com.enrollnow.notification.repositories.OutboxEventRecipientEntityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service that guarantees crash-resilient recipient-level delivery tracking.
 * Each recipient outcome is committed in an independent transaction immediately
 * upon provider acceptance or failure, completely protecting against duplicate delivery
 * across worker crashes, restarts, and outbox event retries.
 */
@Service
public class OutboxRecipientDeliveryTracker {

    private static final Logger log = LoggerFactory.getLogger(OutboxRecipientDeliveryTracker.class);

    private final OutboxEventRecipientEntityRepository repository;

    @Autowired
    public OutboxRecipientDeliveryTracker(OutboxEventRecipientEntityRepository repository) {
        this.repository = repository;
    }

    /**
     * Checks if a recipient has already received the notification for this specific outbox event.
     */
    @Transactional(readOnly = true)
    public boolean isRecipientDelivered(UUID tenantId, UUID outboxEventId, String recipientEmail) {
        if (outboxEventId == null || recipientEmail == null) {
            return false;
        }
        Optional<OutboxEventRecipientEntity> record = repository
                .findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, outboxEventId, recipientEmail);
        return record.isPresent() && "SENT".equalsIgnoreCase(record.get().getStatus());
    }

    /**
     * Records successful provider acceptance in an independent committed transaction.
     * Propagates exceptions on database failure to ensure events are not falsely marked PUBLISHED.
     * Safely handles concurrent insertion conflicts via re-query and state verification.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordDeliverySuccess(UUID tenantId, UUID outboxEventId, String recipientEmail) {
        if (outboxEventId == null || recipientEmail == null) {
            return;
        }
        try {
            OutboxEventRecipientEntity entity = repository
                    .findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, outboxEventId, recipientEmail)
                    .orElseGet(() -> {
                        OutboxEventRecipientEntity e = new OutboxEventRecipientEntity();
                        e.setTenantId(tenantId);
                        e.setOutboxEventId(outboxEventId);
                        e.setRecipientEmail(recipientEmail);
                        e.setCreatedAt(Instant.now());
                        return e;
                    });

            entity.setStatus("SENT");
            entity.setDeliveredAt(Instant.now());
            entity.setLastError(null);
            entity.setUpdatedAt(Instant.now());
            repository.saveAndFlush(entity);
            log.info("Persisted persistent delivery SUCCESS for recipient {} [event: {}]", recipientEmail, outboxEventId);
        } catch (DataIntegrityViolationException dive) {
            log.warn("Concurrent insert conflict on delivery success for recipient {} on event {}. Re-fetching existing record.",
                    recipientEmail, outboxEventId);
            try {
                OutboxEventRecipientEntity existing = repository
                        .findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, outboxEventId, recipientEmail)
                        .orElseThrow(() -> new IllegalStateException("Failed to locate existing recipient record on conflict", dive));
                if (!"SENT".equalsIgnoreCase(existing.getStatus())) {
                    existing.setStatus("SENT");
                    existing.setDeliveredAt(Instant.now());
                    existing.setLastError(null);
                    existing.setUpdatedAt(Instant.now());
                    repository.saveAndFlush(existing);
                }
            } catch (Exception reEx) {
                log.error("Failed to recover from concurrent insert conflict for recipient {}: {}", recipientEmail, reEx.getMessage(), reEx);
                throw reEx;
            }
        } catch (Exception e) {
            log.error("Failed persisting delivery success for recipient {}: {}", recipientEmail, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Records provider delivery failure in an independent committed transaction.
     * Propagates exceptions on database failure so failure is observable and retryable.
     * Safely handles concurrent insertion conflicts via re-query and state update.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordDeliveryFailure(UUID tenantId, UUID outboxEventId, String recipientEmail, String errorMessage) {
        if (outboxEventId == null || recipientEmail == null) {
            return;
        }
        try {
            OutboxEventRecipientEntity entity = repository
                    .findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, outboxEventId, recipientEmail)
                    .orElseGet(() -> {
                        OutboxEventRecipientEntity e = new OutboxEventRecipientEntity();
                        e.setTenantId(tenantId);
                        e.setOutboxEventId(outboxEventId);
                        e.setRecipientEmail(recipientEmail);
                        e.setCreatedAt(Instant.now());
                        return e;
                    });

            entity.setStatus("FAILED");
            entity.setLastError(errorMessage);
            entity.setAttemptCount(entity.getAttemptCount() + 1);
            entity.setUpdatedAt(Instant.now());
            repository.saveAndFlush(entity);
            log.warn("Persisted persistent delivery FAILURE for recipient {} [event: {}]: {}", recipientEmail, outboxEventId, errorMessage);
        } catch (DataIntegrityViolationException dive) {
            log.warn("Concurrent insert conflict on delivery failure for recipient {} on event {}. Re-fetching existing record.",
                    recipientEmail, outboxEventId);
            try {
                OutboxEventRecipientEntity existing = repository
                        .findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, outboxEventId, recipientEmail)
                        .orElseThrow(() -> new IllegalStateException("Failed to locate existing recipient record on failure conflict", dive));
                existing.setStatus("FAILED");
                existing.setLastError(errorMessage);
                existing.setAttemptCount(existing.getAttemptCount() + 1);
                existing.setUpdatedAt(Instant.now());
                repository.saveAndFlush(existing);
            } catch (Exception reEx) {
                log.error("Failed to recover from concurrent insert conflict on failure for recipient {}: {}", recipientEmail, reEx.getMessage(), reEx);
                throw reEx;
            }
        } catch (Exception e) {
            log.error("Failed persisting delivery failure for recipient {}: {}", recipientEmail, e.getMessage(), e);
            throw e;
        }
    }
}
