package com.enrollnow.audit.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

public record EntityChangeHistoryResponse(
        UUID id,
        UUID auditEventId,
        String entityType,
        UUID entityId,
        String fieldName,
        JsonNode previousValue,
        JsonNode newValue,
        OffsetDateTime changedAt) {
}
