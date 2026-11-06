package com.enrollnow.common.audit;

import java.util.List;
import java.util.UUID;

public record AuditRequest(
        UUID tenantId,
        String entityType,
        UUID entityId,
        String action,
        String description,
        String source,
        List<AuditEntitySnapshot> entities
) {

    public AuditRequest {

        if (tenantId == null) {
            throw new IllegalArgumentException(
                    "tenantId must not be null"
            );
        }

        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException(
                    "entityType must not be blank"
            );
        }

        if (entityId == null) {
            throw new IllegalArgumentException(
                    "entityId must not be null"
            );
        }

        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException(
                    "action must not be blank"
            );
        }

        if (entities == null || entities.isEmpty()) {
            throw new IllegalArgumentException(
                    "entities must not be empty"
            );
        }

        entities = List.copyOf(entities);
    }
}