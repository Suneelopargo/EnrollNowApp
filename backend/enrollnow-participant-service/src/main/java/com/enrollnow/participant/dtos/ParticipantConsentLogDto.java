package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ParticipantConsentLogDto {

    private UUID id;
    private UUID tenantId;
    private UUID participantId;
    private UUID studyId;
    private String studyName;

    private OffsetDateTime consentDate;
    private String formattedConsentDate;

    private String consentType;
    private String consentTitle;
    private String consentedBy;
    private String version;
    private OffsetDateTime expiration;
    private String formattedExpiration;

    private boolean fileAttached;
    private UUID fileId;
    private String fileName;
    private Long fileSizeBytes;
    private String fileContentType;
    private String downloadUrl;

    private String comments;

    private boolean sticky;
    private boolean notify;
    private boolean global;
    private boolean lastContact;

    private OffsetDateTime createdAt;
    private UUID createdBy;
    private String createdByName;
    private String createdByInitials;

    private OffsetDateTime updatedAt;
    private UUID updatedBy;
    private String updatedByName;
    private String updatedByInitials;

    private boolean editable;
    private boolean pinnable;

    public ParticipantConsentLogDto() {
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

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public String getStudyName() {
        return studyName;
    }

    public void setStudyName(String studyName) {
        this.studyName = studyName;
    }

    public OffsetDateTime getConsentDate() {
        return consentDate;
    }

    public void setConsentDate(OffsetDateTime consentDate) {
        this.consentDate = consentDate;
    }

    public String getFormattedConsentDate() {
        return formattedConsentDate;
    }

    public void setFormattedConsentDate(String formattedConsentDate) {
        this.formattedConsentDate = formattedConsentDate;
    }

    public String getConsentType() {
        return consentType;
    }

    public void setConsentType(String consentType) {
        this.consentType = consentType;
    }

    public String getConsentTitle() {
        return consentTitle;
    }

    public void setConsentTitle(String consentTitle) {
        this.consentTitle = consentTitle;
    }

    public String getConsentedBy() {
        return consentedBy;
    }

    public void setConsentedBy(String consentedBy) {
        this.consentedBy = consentedBy;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public OffsetDateTime getExpiration() {
        return expiration;
    }

    public void setExpiration(OffsetDateTime expiration) {
        this.expiration = expiration;
    }

    public String getFormattedExpiration() {
        return formattedExpiration;
    }

    public void setFormattedExpiration(String formattedExpiration) {
        this.formattedExpiration = formattedExpiration;
    }

    public boolean isFileAttached() {
        return fileAttached;
    }

    public void setFileAttached(boolean fileAttached) {
        this.fileAttached = fileAttached;
    }

    public UUID getFileId() {
        return fileId;
    }

    public void setFileId(UUID fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getFileContentType() {
        return fileContentType;
    }

    public void setFileContentType(String fileContentType) {
        this.fileContentType = fileContentType;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public boolean isSticky() {
        return sticky;
    }

    public void setSticky(boolean sticky) {
        this.sticky = sticky;
    }

    public boolean isNotify() {
        return notify;
    }

    public void setNotify(boolean notify) {
        this.notify = notify;
    }

    public boolean isGlobal() {
        return global;
    }

    public void setGlobal(boolean global) {
        this.global = global;
    }

    public boolean isLastContact() {
        return lastContact;
    }

    public void setLastContact(boolean lastContact) {
        this.lastContact = lastContact;
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

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public String getCreatedByInitials() {
        return createdByInitials;
    }

    public void setCreatedByInitials(String createdByInitials) {
        this.createdByInitials = createdByInitials;
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

    public String getUpdatedByName() {
        return updatedByName;
    }

    public void setUpdatedByName(String updatedByName) {
        this.updatedByName = updatedByName;
    }

    public String getUpdatedByInitials() {
        return updatedByInitials;
    }

    public void setUpdatedByInitials(String updatedByInitials) {
        this.updatedByInitials = updatedByInitials;
    }

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }

    public boolean isPinnable() {
        return pinnable;
    }

    public void setPinnable(boolean pinnable) {
        this.pinnable = pinnable;
    }
}
