package com.enrollnow.notification.dto;

import java.time.Instant;

public class UpdateTaskDueDateRequest {

    private Instant dueAt;
    private String dueDate;

    public UpdateTaskDueDateRequest() {
    }

    public UpdateTaskDueDateRequest(Instant dueAt) {
        this.dueAt = dueAt;
    }

    public Instant getDueAt() {
        if (dueAt != null) {
            return dueAt;
        }
        if (dueDate != null && !dueDate.isBlank()) {
            try {
                return Instant.parse(dueDate);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }
}
