package com.enrollnow.study.models;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "studies",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_studies_tenant_code",
            columnNames = {"tenant_id", "study_code"}
        ),
        @UniqueConstraint(
            name = "uk_studies_tenant_id",
            columnNames = {"tenant_id", "id"}
        )
    }
)
public class Study {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "study_code", nullable = false, length = 50)
    private String studyCode;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "long_name", columnDefinition = "TEXT")
    private String longName;

    @Column(name = "prefix", length = 50)
    private String prefix;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "irb_id", length = 100)
    private String irbId;

    @Column(name = "recruitment_start_date")
    private LocalDate recruitmentStartDate;

    @Column(name = "recruitment_end_date")
    private LocalDate recruitmentEndDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "sample_size")
    private Integer sampleSize;

    @Column(name = "locale", length = 20)
    private String locale;

    @Column(name = "custom_id_generation_enabled", nullable = false)
    private boolean customIdGenerationEnabled = false;

    @Column(name = "next_sequential_identifier", nullable = false)
    private long nextSequentialIdentifier = 0;

    @Column(name = "allow_participation_in_other_studies", nullable = false)
    private boolean allowParticipationInOtherStudies = true;

    @Column(name = "show_global_comments", nullable = false)
    private boolean showGlobalComments = false;

    @Column(name = "default_global_logs", nullable = false)
    private boolean defaultGlobalLogs = false;

    @Column(name = "study_url_label", length = 100)
    private String studyUrlLabel;

    @Column(name = "study_url", columnDefinition = "TEXT")
    private String studyUrl;

    @Column(name = "archived", nullable = false)
    private boolean archived = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
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

    public String getStudyCode() {
        return studyCode;
    }

    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLongName() {
        return longName;
    }

    public void setLongName(String longName) {
        this.longName = longName;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIrbId() {
        return irbId;
    }

    public void setIrbId(String irbId) {
        this.irbId = irbId;
    }

    public LocalDate getRecruitmentStartDate() {
        return recruitmentStartDate;
    }

    public void setRecruitmentStartDate(LocalDate recruitmentStartDate) {
        this.recruitmentStartDate = recruitmentStartDate;
    }

    public LocalDate getRecruitmentEndDate() {
        return recruitmentEndDate;
    }

    public void setRecruitmentEndDate(LocalDate recruitmentEndDate) {
        this.recruitmentEndDate = recruitmentEndDate;
    }

    public LocalDate getCompletionDate() {
        return completionDate;
    }

    public void setCompletionDate(LocalDate completionDate) {
        this.completionDate = completionDate;
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public boolean isCustomIdGenerationEnabled() {
        return customIdGenerationEnabled;
    }

    public void setCustomIdGenerationEnabled(boolean customIdGenerationEnabled) {
        this.customIdGenerationEnabled = customIdGenerationEnabled;
    }

    public long getNextSequentialIdentifier() {
        return nextSequentialIdentifier;
    }

    public void setNextSequentialIdentifier(long nextSequentialIdentifier) {
        this.nextSequentialIdentifier = nextSequentialIdentifier;
    }

    public boolean isAllowParticipationInOtherStudies() {
        return allowParticipationInOtherStudies;
    }

    public void setAllowParticipationInOtherStudies(boolean allowParticipationInOtherStudies) {
        this.allowParticipationInOtherStudies = allowParticipationInOtherStudies;
    }

    public boolean isShowGlobalComments() {
        return showGlobalComments;
    }

    public void setShowGlobalComments(boolean showGlobalComments) {
        this.showGlobalComments = showGlobalComments;
    }

    public boolean isDefaultGlobalLogs() {
        return defaultGlobalLogs;
    }

    public void setDefaultGlobalLogs(boolean defaultGlobalLogs) {
        this.defaultGlobalLogs = defaultGlobalLogs;
    }

    public String getStudyUrlLabel() {
        return studyUrlLabel;
    }

    public void setStudyUrlLabel(String studyUrlLabel) {
        this.studyUrlLabel = studyUrlLabel;
    }

    public String getStudyUrl() {
        return studyUrl;
    }

    public void setStudyUrl(String studyUrl) {
        this.studyUrl = studyUrl;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
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