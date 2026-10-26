package com.enrollnow.study.dtos;

public class SaveTextTemplateRequest {

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
