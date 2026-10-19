package com.enrollnow.study.dtos;

import java.util.UUID;

public class StudySummaryResponse {

    private UUID id;
    private String studyCode;
    private String name;
    private String description;
    private boolean archived;

    public StudySummaryResponse() {
    }

    public StudySummaryResponse(UUID id, String studyCode, String name, String description, boolean archived) {
        this.id = id;
        this.studyCode = studyCode;
        this.name = name;
        this.description = description;
        this.archived = archived;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getStudyCode() {
        return studyCode;
    }

    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }
}
