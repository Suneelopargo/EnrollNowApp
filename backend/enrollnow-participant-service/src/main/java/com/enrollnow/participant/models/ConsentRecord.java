package com.enrollnow.participant.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "consents",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_consents_tenant_id", columnNames = {"tenant_id", "id"})
    }
)
public class ConsentRecord {

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

    @Column(name = "candidate_id")
    private UUID candidateId;

    @Column(name = "consent_version_id", nullable = false)
    private UUID consentVersionId;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, CONSENTED, DECLINED, WITHDRAWN

    @Column(name = "consented_at")
    private OffsetDateTime consentedAt;

    @Column(name = "declined_at")
    private OffsetDateTime declinedAt;

    @Column(name = "withdrawn_at")
    private OffsetDateTime withdrawnAt;

    @Column(name = "consented_by_user_id")
    private UUID consentedByUserId;

    @Column(name = "consent_method", length = 30)
    private String consentMethod;

    @Column(name = "withdrawal_reason", length = 500)
    private String withdrawalReason;

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

    public ConsentRecord() {
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

    public UUID getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(UUID candidateId) {
        this.candidateId = candidateId;
    }

    public UUID getConsentVersionId() {
        return consentVersionId;
    }

    public void setConsentVersionId(UUID consentVersionId) {
        this.consentVersionId = consentVersionId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getConsentedAt() {
        return consentedAt;
    }

    public void setConsentedAt(OffsetDateTime consentedAt) {
        this.consentedAt = consentedAt;
    }

    public OffsetDateTime getDeclinedAt() {
        return declinedAt;
    }

    public void setDeclinedAt(OffsetDateTime declinedAt) {
        this.declinedAt = declinedAt;
    }

    public OffsetDateTime getWithdrawnAt() {
        return withdrawnAt;
    }

    public void setWithdrawnAt(OffsetDateTime withdrawnAt) {
        this.withdrawnAt = withdrawnAt;
    }

    public UUID getConsentedByUserId() {
        return consentedByUserId;
    }

    public void setConsentedByUserId(UUID consentedByUserId) {
        this.consentedByUserId = consentedByUserId;
    }

    public String getConsentMethod() {
        return consentMethod;
    }

    public void setConsentMethod(String consentMethod) {
        this.consentMethod = consentMethod;
    }

    public String getWithdrawalReason() {
        return withdrawalReason;
    }

    public void setWithdrawalReason(String withdrawalReason) {
        this.withdrawalReason = withdrawalReason;
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
