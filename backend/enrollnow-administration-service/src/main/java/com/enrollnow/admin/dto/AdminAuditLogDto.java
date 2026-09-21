package com.enrollnow.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class AdminAuditLogDto {
    private Long id;
    private String action;
    private Long performedBy;
    private String performedByUsername;
    private Long targetUserId;
    private String targetUsername;
    private String details;
    private String ipAddress;
    private Long locationId;
    private OffsetDateTime createdAt;

    public AdminAuditLogDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Long getPerformedBy() { return performedBy; }
    public void setPerformedBy(Long performedBy) { this.performedBy = performedBy; }
    public String getPerformedByUsername() { return performedByUsername; }
    public void setPerformedByUsername(String performedByUsername) { this.performedByUsername = performedByUsername; }
    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }
    public String getTargetUsername() { return targetUsername; }
    public void setTargetUsername(String targetUsername) { this.targetUsername = targetUsername; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
