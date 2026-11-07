package com.enrollnow.notification.dto;

import java.time.Instant;

public class UpdateTaskDueDateRequest {

    private Instant dueAt;

    public UpdateTaskDueDateRequest() {
    }

    public UpdateTaskDueDateRequest(Instant dueAt) {
        this.dueAt = dueAt;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
    }
}
