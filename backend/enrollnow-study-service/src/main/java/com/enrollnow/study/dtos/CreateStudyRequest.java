package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class CreateStudyRequest {

    @NotBlank(message = "Study name/title is required")
    @JsonAlias("title")
    private String name;

    @JsonAlias("protocolNumber")
    private String studyCode;

    private String description;

    @JsonAlias("targetEnrollment")
    private Integer sampleSize;

    public CreateStudyRequest() {
    }

    public CreateStudyRequest(String name, String studyCode, String description, Integer sampleSize) {
        this.name = name;
        this.studyCode = studyCode;
        this.description = description;
        this.sampleSize = sampleSize;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return name;
    }

    public void setTitle(String title) {
        this.name = title;
    }

    public String getStudyCode() {
        return studyCode;
    }

    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
    }

    public String getProtocolNumber() {
        return studyCode;
    }

    public void setProtocolNumber(String protocolNumber) {
        this.studyCode = protocolNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }
}
