package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventRecipientEntity;
import com.enrollnow.notification.repositories.OutboxEventRecipientEntityRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public OutboxRecipientDeliveryTracker(
            OutboxEventRecipientEntityRepository repository,
            @Autowired(required = false) JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureTableExists() {
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS enrollnow.outbox_event_recipients (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        tenant_id UUID NOT NULL,
                        outbox_event_id UUID NOT NULL REFERENCES enrollnow.outbox_events(id) ON DELETE CASCADE,
                        recipient_email VARCHAR(255) NOT NULL,
                        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                        delivered_at TIMESTAMPTZ,
                        last_error TEXT,
                        attempt_count INTEGER NOT NULL DEFAULT 1,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        CONSTRAINT uk_outbox_event_recipient_delivery UNIQUE (tenant_id, outbox_event_id, recipient_email)
                    );
                    CREATE INDEX IF NOT EXISTS ix_outbox_event_recipients_event
                        ON enrollnow.outbox_event_recipients (tenant_id, outbox_event_id, status);
                """);
                log.info("Ensured enrollnow.outbox_event_recipients table and index exist.");
            } catch (Exception ex) {
                log.debug("Auto DDL check for outbox_event_recipients: {}", ex.getMessage());
            }
        }
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
     * Records successful provider acceptance in an independent transaction.
     * Committed immediately before subsequent recipients or outbox completion are processed.
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
        } catch (Exception e) {
            log.error("Failed persisting delivery success for recipient {}: {}", recipientEmail, e.getMessage(), e);
        }
    }

    /**
     * Records provider delivery failure in an independent transaction.
     * Keeps the recipient eligible for future retry while maintaining an audit trail of errors.
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
        } catch (Exception e) {
            log.error("Failed persisting delivery failure for recipient {}: {}", recipientEmail, e.getMessage(), e);
        }
    }
}
