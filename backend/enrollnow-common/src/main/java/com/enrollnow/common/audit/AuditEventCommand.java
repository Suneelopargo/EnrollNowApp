package com.enrollnow.common.audit;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Module-neutral audit request.
 *
 * Feature modules use this command to describe what happened without
 * knowing how or where the audit information is persisted.
 *
 * Never place passwords, password hashes, JWTs, invitation/reset tokens,
 * API keys, credentials or other secrets in beforeData or afterData.
 */
public record AuditEventCommand(
        UUID tenantId,
        UUID actorUserId,
        String entityType,
        UUID entityId,
        String action,
        String description,
        String source,
        UUID correlationId,
        String requestId,
        Map<String, Object> beforeData,
        Map<String, Object> afterData,
        List<AuditChange> changes
) {

    public AuditEventCommand {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId must not be null");
        }

        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException("entityType must not be blank");
        }

        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("action must not be blank");
        }
    }
}