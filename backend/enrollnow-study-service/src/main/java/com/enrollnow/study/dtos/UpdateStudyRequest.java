package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;

public class UpdateStudyRequest {

    @JsonAlias("title")
    private String name;

    private String description;

    private Boolean archived;

    @JsonAlias("targetEnrollment")
    private Integer sampleSize;

    public UpdateStudyRequest() {
    }

    public UpdateStudyRequest(String name, String description, Boolean archived, Integer sampleSize) {
        this.name = name;
        this.description = description;
        this.archived = archived;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getArchived() {
        return archived;
    }

    public void setArchived(Boolean archived) {
        this.archived = archived;
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }
}
