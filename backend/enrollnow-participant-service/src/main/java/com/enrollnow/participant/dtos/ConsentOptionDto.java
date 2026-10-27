package com.enrollnow.participant.dtos;

import java.util.UUID;

public class ConsentOptionDto {
    private UUID studyId;
    private String studyName;
    private UUID consentVersionId;
    private String consentVersionTitle;
    private String versionNumber;

    public ConsentOptionDto() {}

    public ConsentOptionDto(UUID studyId, String studyName, UUID consentVersionId, String consentVersionTitle, String versionNumber) {
        this.studyId = studyId;
        this.studyName = studyName;
        this.consentVersionId = consentVersionId;
        this.consentVersionTitle = consentVersionTitle;
        this.versionNumber = versionNumber;
    }

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
}
