package com.enrollnow.study.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SaveTextTemplateRequest {

    @NotBlank(message = "Template name is required")
    @Size(max = 100, message = "Template name must not exceed 100 characters")
    private String name;
    private String description;
    private String message;
    private StudyScheduledActionDto scheduledAction;

    public SaveTextTemplateRequest() {
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public StudyScheduledActionDto getScheduledAction() {
        return scheduledAction;
    }

    public void setScheduledAction(StudyScheduledActionDto scheduledAction) {
        this.scheduledAction = scheduledAction;
    }
}
