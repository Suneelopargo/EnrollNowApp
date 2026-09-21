package com.enrollnow.models;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(name = "performed_by_username", length = 100)
    private String performedByUsername;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private User targetUser;

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

    public AdminAuditLog(String action, String performedByUsername, String details, String ipAddress) {
        this.action = action;
        this.performedByUsername = performedByUsername;
        this.details = details;
        this.ipAddress = ipAddress;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public User getPerformedBy() { return performedBy; }
    public void setPerformedBy(User performedBy) { this.performedBy = performedBy; }
    public String getPerformedByUsername() { return performedByUsername; }
    public void setPerformedByUsername(String performedByUsername) { this.performedByUsername = performedByUsername; }
    public User getTargetUser() { return targetUser; }
    public void setTargetUser(User targetUser) { this.targetUser = targetUser; }
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
