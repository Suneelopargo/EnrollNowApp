package com.enrollnow.common.audit;

import java.util.UUID;

public record AuditChange(
        String entityType,
        UUID entityId,
        String fieldName,
        Object previousValue,
        Object newValue
) {

    /*
     * Backward-compatible constructor.
     *
     * Existing code such as:
     *
     * new AuditChange(
     *     "studyPermission",
     *     previousRole,
     *     newRole
     * )
     *
     * will continue to work.
     *
     * When entityType/entityId are null,
     * AuditRecorderImpl will use the parent
     * AuditEventCommand entity.
     */
    public AuditChange(
            String fieldName,
            Object previousValue,
            Object newValue
    ) {
        this(
                null,
                null,
                fieldName,
                previousValue,
                newValue
        );
    }

    public AuditChange {
        if (fieldName == null || fieldName.isBlank()) {
            throw new IllegalArgumentException(
                    "fieldName must not be blank"
            );
        }

        if (entityType != null && entityType.isBlank()) {
            throw new IllegalArgumentException(
                    "entityType must not be blank when supplied"
            );
        }
    }
}