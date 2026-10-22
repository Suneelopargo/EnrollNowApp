package com.enrollnow.participant.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "study_enrollments",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_study_enrollments_tenant_id", columnNames = {"tenant_id", "id"}),
        @UniqueConstraint(name = "uk_study_enrollments_participant_study", columnNames = {"tenant_id", "study_id", "participant_id"})
    }
)
public class StudyEnrollment {

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

    @Column(name = "study_participant_id", length = 100)
    private String studyParticipantId;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "ENROLLED";

    @Column(name = "enrolled_at", nullable = false)
    private OffsetDateTime enrolledAt = OffsetDateTime.now();

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    public StudyEnrollment() {
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

    public String getStudyParticipantId() {
        return studyParticipantId;
    }

    public void setStudyParticipantId(String studyParticipantId) {
        this.studyParticipantId = studyParticipantId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(OffsetDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
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
}
