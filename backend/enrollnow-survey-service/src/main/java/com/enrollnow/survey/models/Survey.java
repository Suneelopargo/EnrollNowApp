package com.enrollnow.survey.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "surveys")
public class Survey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "survey_code", nullable = false, unique = true, length = 64)
    private String surveyCode;

    @Column(name = "study_id")
    private Long studyId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description = "";

    @Column(nullable = false, length = 30)
    private String status = "DRAFT";

    @Column(name = "anonymous_responses", nullable = false)
    private boolean anonymousResponses = true;

    @Column(name = "allow_multiple_responses", nullable = false)
    private boolean allowMultipleResponses = false;

    @Column(name = "show_progress_bar", nullable = false)
    private boolean showProgressBar = true;

    @Column(name = "thank_you_message", columnDefinition = "TEXT")
    private String thankYouMessage = "Thank you for your valuable feedback!";

    @Column(name = "is_global_submission", nullable = false)
    private boolean globalSubmission = false;

    @Column(name = "trigger_email_notification", nullable = false)
    private boolean triggerEmailNotification = false;

    @Column(name = "enable_econsent_countersign", nullable = false)
    private boolean enableEconsentCountersign = false;

    @Column(name = "require_recaptcha", nullable = false)
    private boolean requireRecaptcha = false;

    @Column(name = "public_token", nullable = false, unique = true, length = 64)
    private String publicToken;

    @Column(name = "definition_json", columnDefinition = "TEXT")
    private String definitionJson = "{}";

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<Question> questions = new ArrayList<>();

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<SurveySection> sections = new ArrayList<>();

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<LogicRule> logicRules = new ArrayList<>();

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("versionNumber ASC")
    private List<SurveyVersion> versions = new ArrayList<>();

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SurveyAssignment> assignments = new ArrayList<>();

    public Survey() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSurveyCode() { return surveyCode; }
    public void setSurveyCode(String surveyCode) { this.surveyCode = surveyCode; }

    public Long getStudyId() { return studyId; }
    public void setStudyId(Long studyId) { this.studyId = studyId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isAnonymousResponses() { return anonymousResponses; }
    public void setAnonymousResponses(boolean anonymousResponses) { this.anonymousResponses = anonymousResponses; }

    public boolean isAllowMultipleResponses() { return allowMultipleResponses; }
    public void setAllowMultipleResponses(boolean allowMultipleResponses) { this.allowMultipleResponses = allowMultipleResponses; }

    public boolean isShowProgressBar() { return showProgressBar; }
    public void setShowProgressBar(boolean showProgressBar) { this.showProgressBar = showProgressBar; }

    public String getThankYouMessage() { return thankYouMessage; }
    public void setThankYouMessage(String thankYouMessage) { this.thankYouMessage = thankYouMessage; }

    public boolean isGlobalSubmission() { return globalSubmission; }
    public void setGlobalSubmission(boolean globalSubmission) { this.globalSubmission = globalSubmission; }

    public boolean isTriggerEmailNotification() { return triggerEmailNotification; }
    public void setTriggerEmailNotification(boolean triggerEmailNotification) { this.triggerEmailNotification = triggerEmailNotification; }

    public boolean isEnableEconsentCountersign() { return enableEconsentCountersign; }
    public void setEnableEconsentCountersign(boolean enableEconsentCountersign) { this.enableEconsentCountersign = enableEconsentCountersign; }

    public boolean isRequireRecaptcha() { return requireRecaptcha; }
    public void setRequireRecaptcha(boolean requireRecaptcha) { this.requireRecaptcha = requireRecaptcha; }

    public String getPublicToken() { return publicToken; }
    public void setPublicToken(String publicToken) { this.publicToken = publicToken; }

    public String getDefinitionJson() { return definitionJson; }
    public void setDefinitionJson(String definitionJson) { this.definitionJson = definitionJson; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public Long getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(Long updatedBy) { this.updatedBy = updatedBy; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }

    public List<SurveySection> getSections() { return sections; }
    public void setSections(List<SurveySection> sections) { this.sections = sections; }

    public List<LogicRule> getLogicRules() { return logicRules; }
    public void setLogicRules(List<LogicRule> logicRules) { this.logicRules = logicRules; }

    public List<SurveyVersion> getVersions() { return versions; }
    public void setVersions(List<SurveyVersion> versions) { this.versions = versions; }

    public List<SurveyAssignment> getAssignments() { return assignments; }
    public void setAssignments(List<SurveyAssignment> assignments) { this.assignments = assignments; }
}
