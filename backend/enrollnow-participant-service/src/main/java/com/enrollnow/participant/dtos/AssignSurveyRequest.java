package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public class AssignSurveyRequest {
    @NotNull(message = "Survey definition ID is required")
    private UUID surveyDefinitionId;

    private UUID studyId;
    private String studyIdentifier;
    private OffsetDateTime dueAt;

    public AssignSurveyRequest() {}

    public UUID getSurveyDefinitionId() { return surveyDefinitionId; }
    public void setSurveyDefinitionId(UUID surveyDefinitionId) { this.surveyDefinitionId = surveyDefinitionId; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
        if (studyId != null) {
            this.studyIdentifier = studyId.toString();
        }
    }

    @JsonSetter("studyId")
    public void setStudyIdFromRaw(Object raw) {
        if (raw == null) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        String str = raw.toString().trim();
        if (str.isEmpty()) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        try {
            this.studyId = UUID.fromString(str);
            this.studyIdentifier = str;
        } catch (IllegalArgumentException e) {
            this.studyId = null;
            this.studyIdentifier = str;
        }
    }

    public String getStudyIdentifier() {
        return studyIdentifier;
    }

    public void setStudyIdentifier(String studyIdentifier) {
        this.studyIdentifier = studyIdentifier;
    }

    public OffsetDateTime getDueAt() { return dueAt; }
    public void setDueAt(OffsetDateTime dueAt) { this.dueAt = dueAt; }
}
