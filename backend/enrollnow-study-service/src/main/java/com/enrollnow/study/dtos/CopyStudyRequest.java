package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CopyStudyRequest {

    @NotBlank(message = "Study name is required")
    @Size(max = 15, message = "Short study name must not exceed 15 characters")
    @Pattern(regexp = "^[a-zA-Z0-9 _-]+$", message = "Short study name may only contain letters, numbers, spaces, hyphens, and underscores")
    @JsonAlias({"title", "shortName", "name"})
    private String studyName;

    @NotBlank(message = "Source study ID is required")
    @JsonAlias({"templateId", "idOfStudyToCopy", "sourceId"})
    private String sourceStudyId;

    public CopyStudyRequest() {
    }

    public CopyStudyRequest(String studyName, String sourceStudyId) {
        this.studyName = studyName;
        this.sourceStudyId = sourceStudyId;
    }

    public String getStudyName() {
        return studyName;
    }

    public void setStudyName(String studyName) {
        this.studyName = studyName;
    }

    public String getShortName() {
        return studyName;
    }

    public void setShortName(String shortName) {
        this.studyName = shortName;
    }

    public String getSourceStudyId() {
        return sourceStudyId;
    }

    public void setSourceStudyId(String sourceStudyId) {
        this.sourceStudyId = sourceStudyId;
    }

    public String getTemplateId() {
        return sourceStudyId;
    }

    public void setTemplateId(String templateId) {
        this.sourceStudyId = templateId;
    }
}
