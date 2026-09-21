package com.enrollnow.audit.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "performed_by")
    private Long performedBy;

    @Column(name = "performed_by_username", length = 100)
    private String performedByUsername;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "target_username", length = 100)
    private String targetUsername;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public AdminAuditLog() {}

    public AdminAuditLog(String action, Long performedBy, String performedByUsername,
                         Long targetUserId, String targetUsername, String details, String ipAddress) {
        this.action = action;
        this.performedBy = performedBy;
        this.performedByUsername = performedByUsername;
        this.targetUserId = targetUserId;
        this.targetUsername = targetUsername;
        this.details = details;
        this.ipAddress = ipAddress;
        this.createdAt = OffsetDateTime.now();
    }

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
