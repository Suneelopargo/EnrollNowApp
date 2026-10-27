package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public class ImportStudyRequest {

    @NotBlank(message = "Must provide a study name to import a new study.")
    @Size(max = 15, message = "Short study name must not exceed 15 characters.")
    @JsonAlias({"shortName", "name", "title"})
    private String studyName;

    @JsonAlias({"studyData", "data", "payload", "configuration"})
    private Map<String, Object> studyData;

    public ImportStudyRequest() {
    }

    public ImportStudyRequest(String studyName, Map<String, Object> studyData) {
        this.studyName = studyName;
        this.studyData = studyData;
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

    public Map<String, Object> getStudyData() {
        return studyData;
    }

    public void setStudyData(Map<String, Object> studyData) {
        this.studyData = studyData;
    }
}
