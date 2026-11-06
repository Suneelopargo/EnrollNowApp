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
import com.fasterxml.jackson.databind.ObjectMapper;

import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditRequest;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

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
    private final ObjectMapper objectMapper;

    public AuditRecorderImpl(
            AuditEventRepository auditEventRepository,
            EntityChangeHistoryRepository entityChangeHistoryRepository,
            CurrentActorProvider currentActorProvider,
            ObjectMapper objectMapper) {

        this.auditEventRepository = auditEventRepository;
        this.entityChangeHistoryRepository = entityChangeHistoryRepository;
        this.currentActorProvider = currentActorProvider;
        this.objectMapper = objectMapper;
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

        for (AuditChange change : command.changes()) {

            String changeEntityType =
                    change.entityType() != null
                            ? change.entityType()
                            : command.entityType();

            UUID changeEntityId =
                    change.entityId() != null
                            ? change.entityId()
                            : command.entityId();

            if (changeEntityId == null) {
                throw new IllegalArgumentException(
                        "entityId is required for field-level audit changes"
                );
            }

            EntityChangeHistory history = new EntityChangeHistory();

            history.setId(UUID.randomUUID());
            history.setTenantId(command.tenantId());
            history.setAuditEventId(savedEvent.getId());

            history.setEntityType(changeEntityType);
            history.setEntityId(changeEntityId);
            history.setFieldName(change.fieldName());

            history.setPreviousValue(
                    objectMapper.valueToTree(change.previousValue())
            );

            history.setNewValue(
                    objectMapper.valueToTree(change.newValue())
            );

            history.setChangedAt(now);

            entityChangeHistoryRepository.save(history);
        }
    }
    
    @Override
    @Transactional
    public void record(AuditRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "audit request must not be null"
            );
        }

        List<AuditChange> changes =
                new ArrayList<>();

        for (AuditEntitySnapshot entity : request.entities()) {

            Map<String, Object> before =
                    entity.beforeData() == null
                            ? Map.of()
                            : entity.beforeData();

            Map<String, Object> after =
                    entity.afterData() == null
                            ? Map.of()
                            : entity.afterData();

            Set<String> fieldNames =
                    new LinkedHashSet<>();

            fieldNames.addAll(before.keySet());
            fieldNames.addAll(after.keySet());

            for (String fieldName : fieldNames) {

                Object previousValue =
                        before.get(fieldName);

                Object newValue =
                        after.get(fieldName);

                if (Objects.equals(
                        previousValue,
                        newValue
                )) {
                    continue;
                }

                changes.add(
                        new AuditChange(
                                entity.entityType(),
                                entity.entityId(),
                                fieldName,
                                previousValue,
                                newValue
                        )
                );
            }
        }

        /*
         * No actual business change = no audit event.
         */
        if (changes.isEmpty()) {
            return;
        }

        Map<String, Object> eventBeforeData = null;
        Map<String, Object> eventAfterData = null;

        /*
         * For a simple single-entity operation, retaining
         * before_data / after_data on audit_events is useful.
         *
         * For multi-entity operations, entity_change_history
         * is the authoritative detail.
         */
        if (request.entities().size() == 1) {

            AuditEntitySnapshot entity =
                    request.entities().get(0);

            if (request.entityType()
                    .equalsIgnoreCase(entity.entityType())
                    && request.entityId()
                    .equals(entity.entityId())) {

                eventBeforeData = entity.beforeData();
                eventAfterData = entity.afterData();
            }
        }

        AuditEventCommand command =
                new AuditEventCommand(
                        request.tenantId(),
                        null,
                        request.entityType(),
                        request.entityId(),
                        request.action(),
                        request.description(),
                        request.source(),
                        null,
                        null,
                        eventBeforeData,
                        eventAfterData,
                        changes
                );

        /*
         * Reuse existing tested persistence implementation.
         */
        record(command);
    }
}