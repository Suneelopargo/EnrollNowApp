package com.enrollnow.audit.dtos;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record AuditEventDetailResponse(
        UUID id,
        UUID actorUserId,
        String actorDisplayName,

        String entityType,
        UUID entityId,
        String entityDisplayName,

        String action,
        String description,
        String source,
        UUID correlationId,
        String requestId,
        Map<String, Object> beforeData,
        Map<String, Object> afterData,
        List<EntityChangeHistoryResponse> changes,
        OffsetDateTime occurredAt,
        OffsetDateTime createdAt
) {
}