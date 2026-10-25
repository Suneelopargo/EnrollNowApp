package com.enrollnow.study.dtos;

public class SaveBulkTaskGroupRequest {

    private String name;
    private String description;
    private Boolean triggerActive;
    private StudyBulkTasksResponse.BulkTaskTriggerDto trigger;

    public SaveBulkTaskGroupRequest() {
    }

    public SaveBulkTaskGroupRequest(String name, String description, Boolean triggerActive, StudyBulkTasksResponse.BulkTaskTriggerDto trigger) {
        this.name = name;
        this.description = description;
        this.triggerActive = triggerActive;
        this.trigger = trigger;
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

    public Boolean getTriggerActive() {
        return triggerActive;
    }

    public void setTriggerActive(Boolean triggerActive) {
        this.triggerActive = triggerActive;
    }

    public StudyBulkTasksResponse.BulkTaskTriggerDto getTrigger() {
        return trigger;
    }

    public void setTrigger(StudyBulkTasksResponse.BulkTaskTriggerDto trigger) {
        this.trigger = trigger;
    }
}
