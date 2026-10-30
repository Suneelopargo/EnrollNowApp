package com.enrollnow.participant.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "participant_consent_logs",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_participant_consent_logs_tenant_id", columnNames = {"tenant_id", "id"})
    }
)
public class ParticipantConsentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "study_id")
    private UUID studyId;

    @Column(name = "consent_date", nullable = false)
    private OffsetDateTime consentDate = OffsetDateTime.now();

    @Column(name = "consent_type", nullable = false, length = 100)
    private String consentType;

    @Column(name = "consent_title", nullable = false, length = 255)
    private String consentTitle;

    @Column(name = "consented_by", length = 255)
    private String consentedBy;

    @Column(name = "version", length = 50)
    private String version;

    @Column(name = "expiration")
    private OffsetDateTime expiration;

    @Column(name = "file_attached", nullable = false)
    private boolean fileAttached = false;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "file_content_type", length = 100)
    private String fileContentType;

    @Column(name = "file_storage_path", length = 1000)
    private String fileStoragePath;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "sticky", nullable = false)
    private boolean sticky = false;

    @Column(name = "notify", nullable = false)
    private boolean notify = false;

    @Column(name = "global", nullable = false)
    private boolean global = true;

    @Column(name = "last_contact", nullable = false)
    private boolean lastContact = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "updated_by", nullable = false)
    private UUID updatedBy;

    public ParticipantConsentLog() {
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

    public OffsetDateTime getConsentDate() {
        return consentDate;
    }

    public void setConsentDate(OffsetDateTime consentDate) {
        this.consentDate = consentDate;
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

    public String getFileStoragePath() {
        return fileStoragePath;
    }

    public void setFileStoragePath(String fileStoragePath) {
        this.fileStoragePath = fileStoragePath;
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
