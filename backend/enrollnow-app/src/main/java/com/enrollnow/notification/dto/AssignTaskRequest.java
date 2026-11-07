package com.enrollnow.notification.dto;

import java.util.List;
import java.util.UUID;

public class AssignTaskRequest {

    private List<UUID> assignedUserIds;

    public AssignTaskRequest() {
    }

    public AssignTaskRequest(List<UUID> assignedUserIds) {
        this.assignedUserIds = assignedUserIds;
    }

    public List<UUID> getAssignedUserIds() {
        return assignedUserIds;
    }

    public void setAssignedUserIds(List<UUID> assignedUserIds) {
        this.assignedUserIds = assignedUserIds;
    }
}
