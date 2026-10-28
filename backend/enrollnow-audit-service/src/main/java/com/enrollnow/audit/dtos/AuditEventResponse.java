package com.enrollnow.audit.dtos;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record AuditEventResponse(
        UUID id,
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
        OffsetDateTime occurredAt,
        OffsetDateTime createdAt) {
}
