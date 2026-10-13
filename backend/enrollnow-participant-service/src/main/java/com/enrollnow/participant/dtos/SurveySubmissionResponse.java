package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SurveySubmissionResponse {
    private String id;
    private UUID participantId;
    private UUID surveyId;
    private UUID studyId;
    private String surveyName;
    private String status;
    private OffsetDateTime submittedAt;
    private String submittedBy;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID v) { participantId = v; }
    public UUID getSurveyId() { return surveyId; }
    public void setSurveyId(UUID v) { surveyId = v; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID v) { studyId = v; }
    public String getSurveyName() { return surveyName; }
    public void setSurveyName(String v) { surveyName = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime v) { submittedAt = v; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String v) { submittedBy = v; }
}
