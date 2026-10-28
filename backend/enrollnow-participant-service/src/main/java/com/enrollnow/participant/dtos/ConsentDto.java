package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ConsentDto {
    private UUID id;
    private UUID participantId;
    private UUID studyId;
    private String studyName;
    private UUID consentVersionId;
    private String consentVersionTitle;
    private String versionNumber;
    private String status;
    private OffsetDateTime consentedAt;
    private String consentedByUserName;
    private String consentMethod;
    private String withdrawalReason;
    private OffsetDateTime createdAt;

    public ConsentDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) { this.studyId = studyId; }
    public String getStudyName() { return studyName; }
    public void setStudyName(String studyName) { this.studyName = studyName; }
    public UUID getConsentVersionId() { return consentVersionId; }
    public void setConsentVersionId(UUID consentVersionId) { this.consentVersionId = consentVersionId; }
    public String getConsentVersionTitle() { return consentVersionTitle; }
    public void setConsentVersionTitle(String consentVersionTitle) { this.consentVersionTitle = consentVersionTitle; }
    public String getVersionNumber() { return versionNumber; }
    public void setVersionNumber(String versionNumber) { this.versionNumber = versionNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getConsentedAt() { return consentedAt; }
    public void setConsentedAt(OffsetDateTime consentedAt) { this.consentedAt = consentedAt; }
    public String getConsentedByUserName() { return consentedByUserName; }
    public void setConsentedByUserName(String consentedByUserName) { this.consentedByUserName = consentedByUserName; }
    public String getConsentMethod() { return consentMethod; }
    public void setConsentMethod(String consentMethod) { this.consentMethod = consentMethod; }
    public String getWithdrawalReason() { return withdrawalReason; }
    public void setWithdrawalReason(String withdrawalReason) { this.withdrawalReason = withdrawalReason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
