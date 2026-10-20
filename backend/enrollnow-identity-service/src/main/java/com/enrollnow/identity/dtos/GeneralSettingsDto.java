package com.enrollnow.identity.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public class GeneralSettingsDto {

    private UUID id;
    private UUID tenantId;

    @NotBlank(message = "Default text reply cannot be blank")
    @Size(max = 160, message = "Default text reply cannot exceed 160 characters")
    private String defaultTextReply = "This is an automated message. We can not receive replies to this number.";

    private OffsetDateTime updatedAt;
    private UUID updatedBy;

    public GeneralSettingsDto() {
    }

    public GeneralSettingsDto(UUID id, UUID tenantId, String defaultTextReply, OffsetDateTime updatedAt, UUID updatedBy) {
        this.id = id;
        this.tenantId = tenantId;
        this.defaultTextReply = defaultTextReply;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getDefaultTextReply() {
        return defaultTextReply;
    }

    public void setDefaultTextReply(String defaultTextReply) {
        this.defaultTextReply = defaultTextReply;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }
}
