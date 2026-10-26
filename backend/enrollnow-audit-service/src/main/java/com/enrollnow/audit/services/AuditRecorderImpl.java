package com.enrollnow.audit.services;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.enrollnow.common.audit.CurrentActorProvider;

import com.enrollnow.audit.models.AuditEvent;
import com.enrollnow.audit.models.EntityChangeHistory;
import com.enrollnow.audit.repositories.AuditEventRepository;
import com.enrollnow.audit.repositories.EntityChangeHistoryRepository;
import com.enrollnow.common.audit.AuditChange;
import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import java.util.UUID;

/**
 * Default persistence implementation of the cross-module AuditRecorder.
 *
 * This implementation joins the caller's transaction.
 *
 * Example:
 *
 *   @Transactional
 *   createUser(...)
 *       -> save user
 *       -> auditRecorder.record(...)
 *
 * If createUser() rolls back, the audit inserts roll back as well.
 */
@Service
public class AuditRecorderImpl implements AuditRecorder {

    private final AuditEventRepository auditEventRepository;
    private final EntityChangeHistoryRepository entityChangeHistoryRepository;
    private final CurrentActorProvider currentActorProvider;

    public AuditRecorderImpl(
            AuditEventRepository auditEventRepository,
            EntityChangeHistoryRepository entityChangeHistoryRepository,
            CurrentActorProvider currentActorProvider) {

        this.auditEventRepository = auditEventRepository;
        this.entityChangeHistoryRepository = entityChangeHistoryRepository;
        this.currentActorProvider = currentActorProvider;
    }

    @Override
    @Transactional
    public void record(AuditEventCommand command) {

        if (command == null) {
            throw new IllegalArgumentException("command must not be null");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        AuditEvent event = new AuditEvent();

        event.setTenantId(command.tenantId());
        UUID actorUserId = command.actorUserId() != null
                ? command.actorUserId()
                : currentActorProvider.getCurrentUserId().orElse(null);

        event.setActorUserId(actorUserId);
        event.setEntityType(command.entityType());
        event.setEntityId(command.entityId());
        event.setAction(command.action());
        event.setDescription(command.description());

        event.setSource(
                command.source() == null || command.source().isBlank()
                        ? "APPLICATION"
                        : command.source()
        );

        event.setCorrelationId(command.correlationId());
        event.setRequestId(command.requestId());
        event.setBeforeData(command.beforeData());
        event.setAfterData(command.afterData());
        event.setOccurredAt(now);
        event.setCreatedAt(now);

        AuditEvent savedEvent = auditEventRepository.save(event);

        if (command.changes() == null || command.changes().isEmpty()) {
            return;
        }

        /*
         * Field-level history requires an identifiable target entity.
         */
        if (command.entityId() == null) {
            throw new IllegalArgumentException(
                    "entityId must not be null when field-level audit changes are supplied");
        }

        for (AuditChange change : command.changes()) {

            if (change == null) {
                continue;
            }

            EntityChangeHistory history = new EntityChangeHistory();

            history.setTenantId(command.tenantId());
            history.setAuditEventId(savedEvent.getId());
            history.setEntityType(command.entityType());
            history.setEntityId(command.entityId());
            history.setFieldName(change.fieldName());
            history.setPreviousValue(change.previousValue());
            history.setNewValue(change.newValue());
            history.setChangedAt(now);

            entityChangeHistoryRepository.save(history);
        }
    }
}