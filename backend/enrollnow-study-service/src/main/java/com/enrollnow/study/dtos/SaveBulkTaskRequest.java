package com.enrollnow.study.dtos;

import java.util.List;

public class SaveBulkTaskRequest {

    private String name;
    private String description;
    private List<String> assignedTo;

    public SaveBulkTaskRequest() {
    }

    public SaveBulkTaskRequest(String name, String description, List<String> assignedTo) {
        this.name = name;
        this.description = description;
        this.assignedTo = assignedTo;
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

    public List<String> getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(List<String> assignedTo) {
        this.assignedTo = assignedTo;
    }
}
