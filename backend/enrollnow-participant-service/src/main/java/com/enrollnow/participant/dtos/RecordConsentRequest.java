package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonSetter;
import java.time.OffsetDateTime;
import java.util.UUID;

public class RecordConsentRequest {
    private UUID studyId;
    private String studyIdentifier;

    private UUID consentVersionId;
    private String consentVersionIdentifier;

    private String status = "CONSENTED"; // CONSENTED, PENDING, DECLINED, WITHDRAWN
    private OffsetDateTime consentDate;
    private String consentMethod = "ELECTRONIC";
    private String withdrawalReason;

    public RecordConsentRequest() {}

    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
        if (studyId != null) {
            this.studyIdentifier = studyId.toString();
        }
    }

    @JsonSetter("studyId")
    public void setStudyIdFromRaw(Object raw) {
        if (raw == null) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        String str = raw.toString().trim();
        if (str.isEmpty()) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        try {
            this.studyId = UUID.fromString(str);
            this.studyIdentifier = str;
        } catch (IllegalArgumentException e) {
            this.studyId = null;
            this.studyIdentifier = str;
        }
    }

    public String getStudyIdentifier() {
        return studyIdentifier;
    }

    public void setStudyIdentifier(String studyIdentifier) {
        this.studyIdentifier = studyIdentifier;
    }

    public UUID getConsentVersionId() { return consentVersionId; }
    public void setConsentVersionId(UUID consentVersionId) {
        this.consentVersionId = consentVersionId;
        if (consentVersionId != null) {
            this.consentVersionIdentifier = consentVersionId.toString();
        }
    }

    @JsonSetter("consentVersionId")
    public void setConsentVersionIdFromRaw(Object raw) {
        if (raw == null) {
            this.consentVersionId = null;
            this.consentVersionIdentifier = null;
            return;
        }
        String str = raw.toString().trim();
        if (str.isEmpty()) {
            this.consentVersionId = null;
            this.consentVersionIdentifier = null;
            return;
        }
        try {
            this.consentVersionId = UUID.fromString(str);
            this.consentVersionIdentifier = str;
        } catch (IllegalArgumentException e) {
            this.consentVersionId = null;
            this.consentVersionIdentifier = str;
        }
    }

    public String getConsentVersionIdentifier() {
        return consentVersionIdentifier;
    }

    public void setConsentVersionIdentifier(String consentVersionIdentifier) {
        this.consentVersionIdentifier = consentVersionIdentifier;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getConsentDate() { return consentDate; }
    public void setConsentDate(OffsetDateTime consentDate) { this.consentDate = consentDate; }
    public String getConsentMethod() { return consentMethod; }
    public void setConsentMethod(String consentMethod) { this.consentMethod = consentMethod; }
    public String getWithdrawalReason() { return withdrawalReason; }
    public void setWithdrawalReason(String withdrawalReason) { this.withdrawalReason = withdrawalReason; }
}
