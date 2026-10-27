package com.enrollnow.study.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StudyMilestoneDto {

    private String id;

    @NotBlank(message = "Milestone date is required")
    private String milestoneDate;

    @NotNull(message = "Participant target is required")
    private Integer participantTarget;

    private String description;

    public StudyMilestoneDto() {
    }

    public StudyMilestoneDto(String id, String milestoneDate, Integer participantTarget, String description) {
        this.id = id;
        this.milestoneDate = milestoneDate;
        this.participantTarget = participantTarget;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMilestoneDate() {
        return milestoneDate;
    }

    public void setMilestoneDate(String milestoneDate) {
        this.milestoneDate = milestoneDate;
    }

    public Integer getParticipantTarget() {
        return participantTarget;
    }

    public void setParticipantTarget(Integer participantTarget) {
        this.participantTarget = participantTarget;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
