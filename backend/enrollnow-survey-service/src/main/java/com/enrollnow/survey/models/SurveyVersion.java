package com.enrollnow.survey.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "survey_versions", uniqueConstraints = {
    @UniqueConstraint(name = "uq_survey_versions_survey_version", columnNames = {"survey_id", "version_number"})
})
public class SurveyVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @Column(name = "version_number", nullable = false)
    private int versionNumber = 1;

    @Column(name = "definition_json", nullable = false, columnDefinition = "TEXT")
    private String definitionJson = "{}";

    @Column(nullable = false, length = 30)
    private String status = "PUBLISHED";

    @Column(name = "published_at", nullable = false, updatable = false)
    private OffsetDateTime publishedAt = OffsetDateTime.now();

    @Column(name = "published_by_user_id")
    private Long publishedByUserId;

    public SurveyVersion() {}

    public SurveyVersion(Survey survey, int versionNumber, String definitionJson, String status, Long publishedByUserId) {
        this.survey = survey;
        this.versionNumber = versionNumber;
        this.definitionJson = definitionJson;
        this.status = status;
        this.publishedByUserId = publishedByUserId;
        this.publishedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }

    public int getVersionNumber() { return versionNumber; }
    public void setVersionNumber(int versionNumber) { this.versionNumber = versionNumber; }

    public String getDefinitionJson() { return definitionJson; }
    public void setDefinitionJson(String definitionJson) { this.definitionJson = definitionJson; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime publishedAt) { this.publishedAt = publishedAt; }

    public Long getPublishedByUserId() { return publishedByUserId; }
    public void setPublishedByUserId(Long publishedByUserId) { this.publishedByUserId = publishedByUserId; }
}
