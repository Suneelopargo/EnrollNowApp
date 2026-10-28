package com.enrollnow.participant.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "study_candidates",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_study_candidates_tenant_id", columnNames = {"tenant_id", "id"}),
        @UniqueConstraint(name = "uk_study_candidates_participant_study", columnNames = {"tenant_id", "study_id", "participant_id"})
    }
)
public class StudyCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "study_id", nullable = false)
    private UUID studyId;

    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "REFERRED";

    @Column(name = "status_reason", length = 500)
    private String statusReason;

    @Column(name = "assigned_to_user_id")
    private UUID assignedToUserId;

    @Column(name = "first_contact_at")
    private OffsetDateTime firstContactAt;

    @Column(name = "last_contact_at")
    private OffsetDateTime lastContactAt;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    public StudyCandidate() {
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

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusReason() {
        return statusReason;
    }

    public void setStatusReason(String statusReason) {
        this.statusReason = statusReason;
    }

    public UUID getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(UUID assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public OffsetDateTime getFirstContactAt() {
        return firstContactAt;
    }

    public void setFirstContactAt(OffsetDateTime firstContactAt) {
        this.firstContactAt = firstContactAt;
    }

    public OffsetDateTime getLastContactAt() {
        return lastContactAt;
    }

    public void setLastContactAt(OffsetDateTime lastContactAt) {
        this.lastContactAt = lastContactAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
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
