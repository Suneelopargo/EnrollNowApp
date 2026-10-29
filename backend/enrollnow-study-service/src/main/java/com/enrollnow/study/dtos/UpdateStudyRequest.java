package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateStudyRequest {

    @Size(max = 15, message = "Short study name must not exceed 15 characters")
    @Pattern(regexp = "^[a-zA-Z0-9 _-]+$", message = "Short study name may only contain letters, numbers, spaces, hyphens, and underscores")
    @JsonAlias({"title", "shortName"})
    private String name;

    private String description;

    private Boolean archived;

    @JsonAlias("targetEnrollment")
    private Integer sampleSize;

    private String status;

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

    public String getShortName() {
        return name;
    }

    public void setShortName(String shortName) {
        this.name = shortName;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
