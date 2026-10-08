package com.enrollnow.study.models;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "study_members",
    schema = "enrollnow"
)
public class StudyMember {

    @EmbeddedId
    private StudyMemberId id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "study_role", length = 100)
    private String studyRole;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "joined_at")
    private OffsetDateTime joinedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (joinedAt == null) {
            joinedAt = now;
        }
    }

    public StudyMemberId getId() {
        return id;
    }

    public void setId(StudyMemberId id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public OffsetDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(OffsetDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getStudyRole() {
        return studyRole;
    }

    public void setStudyRole(String studyRole) {
        this.studyRole = studyRole;
    }
}