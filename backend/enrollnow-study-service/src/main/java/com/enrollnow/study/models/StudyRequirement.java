package com.enrollnow.study.models;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "study_requirements",
    schema = "enrollnow"
)
public class StudyRequirement {

    @Id
    @Column(name = "study_id", nullable = false, updatable = false)
    private UUID studyId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "sample_size")
    private Integer sampleSize;

    @Column(name = "configuration", nullable = false, columnDefinition = "jsonb")
    private String configuration = "{}";

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now();
        }

        if (configuration == null || configuration.isBlank()) {
            configuration = "{}";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }

    public String getConfiguration() {
        return configuration;
    }

    public void setConfiguration(String configuration) {
        this.configuration = configuration;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}