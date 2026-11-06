package com.enrollnow.common.audit;

import java.util.Map;
import java.util.UUID;

public record AuditEntitySnapshot(
        String entityType,
        UUID entityId,
        Map<String, Object> beforeData,
        Map<String, Object> afterData
) {

    public AuditEntitySnapshot {

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

        if (beforeData == null && afterData == null) {
            throw new IllegalArgumentException(
                    "beforeData and afterData cannot both be null"
            );
        }
    }
}