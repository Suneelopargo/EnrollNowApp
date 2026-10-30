package com.enrollnow.common.audit;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AuditOperation {

    private final UUID tenantId;
    private final String entityType;
    private final UUID entityId;
    private final String action;
    private final String description;
    private final String source;

    private Map<String, Object> beforeData;
    private Map<String, Object> afterData;

    private final List<AuditChange> changes = new ArrayList<>();

    public AuditOperation(
            UUID tenantId,
            String entityType,
            UUID entityId,
            String action,
            String description,
            String source
    ) {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId must not be null");
        }

        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException("entityType must not be blank");
        }

        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("action must not be blank");
        }

        this.tenantId = tenantId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.description = description;
        this.source = source;
    }

    public AuditOperation beforeData(Map<String, Object> beforeData) {
        this.beforeData = beforeData;
        return this;
    }

    public AuditOperation afterData(Map<String, Object> afterData) {
        this.afterData = afterData;
        return this;
    }

    /*
     * Change on the parent entity.
     */
    public AuditOperation addChange(
            String fieldName,
            Object previousValue,
            Object newValue
    ) {
        changes.add(
                new AuditChange(
                        fieldName,
                        previousValue,
                        newValue
                )
        );

        return this;
    }

    /*
     * Change on another entity that is part of the same
     * business operation.
     */
    public AuditOperation addChange(
            String changeEntityType,
            UUID changeEntityId,
            String fieldName,
            Object previousValue,
            Object newValue
    ) {
        changes.add(
                new AuditChange(
                        changeEntityType,
                        changeEntityId,
                        fieldName,
                        previousValue,
                        newValue
                )
        );

        return this;
    }

    public List<AuditChange> getChanges() {
        return Collections.unmodifiableList(changes);
    }

    public boolean hasChanges() {
        return !changes.isEmpty();
    }

    public AuditEventCommand toCommand() {
        return new AuditEventCommand(
                tenantId,
                null,
                entityType,
                entityId,
                action,
                description,
                source,
                null,
                null,
                beforeData,
                afterData,
                List.copyOf(changes)
        );
    }
}