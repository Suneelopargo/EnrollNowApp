package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SurveyAssignmentDto {
    private UUID id;
    private UUID participantId;
    private UUID studyId;
    private String studyName;
    private UUID surveyVersionId;
    private String surveyCode;
    private String surveyName;
    private String status;
    private OffsetDateTime assignedAt;
    private OffsetDateTime dueAt;
    private OffsetDateTime completedAt;

    public SurveyAssignmentDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) { this.studyId = studyId; }
    public String getStudyName() { return studyName; }
    public void setStudyName(String studyName) { this.studyName = studyName; }
    public UUID getSurveyVersionId() { return surveyVersionId; }
    public void setSurveyVersionId(UUID surveyVersionId) { this.surveyVersionId = surveyVersionId; }
    public String getSurveyCode() { return surveyCode; }
    public void setSurveyCode(String surveyCode) { this.surveyCode = surveyCode; }
    public String getSurveyName() { return surveyName; }
    public void setSurveyName(String surveyName) { this.surveyName = surveyName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(OffsetDateTime assignedAt) { this.assignedAt = assignedAt; }
    public OffsetDateTime getDueAt() { return dueAt; }
    public void setDueAt(OffsetDateTime dueAt) { this.dueAt = dueAt; }
    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
}
