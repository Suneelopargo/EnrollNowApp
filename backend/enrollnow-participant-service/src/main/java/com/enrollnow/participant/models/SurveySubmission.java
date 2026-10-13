package com.enrollnow.participant.models;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SurveySubmission {
    private String id;
    private UUID participantId;
    private UUID surveyId;
    private UUID studyId;
    private String surveyName;
    private String status;
    private OffsetDateTime submittedAt;
    private String submittedBy;

    public SurveySubmission() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }
    public UUID getSurveyId() { return surveyId; }
    public void setSurveyId(UUID surveyId) { this.surveyId = surveyId; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) { this.studyId = studyId; }
    public String getSurveyName() { return surveyName; }
    public void setSurveyName(String surveyName) { this.surveyName = surveyName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
}
