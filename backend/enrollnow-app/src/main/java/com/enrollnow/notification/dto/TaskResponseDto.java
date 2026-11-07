package com.enrollnow.notification.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class TaskResponseDto {

    private UUID id;
    private UUID taskId;
    private UUID tenantId;
    private UUID studyId;
    private UUID participantId;
    private String title;
    private String description;
    private String taskType;
    private String category;
    private String priority;
    private String status;
    private Instant dueAt;
    private String dueDate;
    private String assignee;
    private List<UUID> assignedUserIds;
    private Instant createdAt;
    private Instant updatedAt;

    public TaskResponseDto() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
        this.taskId = id;
    }

    public UUID getTaskId() {
        return taskId != null ? taskId : id;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
        this.id = taskId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
        this.category = taskType;
    }

    public String getCategory() {
        return category != null ? category : taskType;
    }

    public void setCategory(String category) {
        this.category = category;
        this.taskType = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
        if (dueAt != null) {
            this.dueDate = dueAt.toString();
        }
    }

    public String getDueDate() {
        return dueDate != null ? dueDate : (dueAt != null ? dueAt.toString() : null);
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public List<UUID> getAssignedUserIds() {
        return assignedUserIds;
    }

    public void setAssignedUserIds(List<UUID> assignedUserIds) {
        this.assignedUserIds = assignedUserIds;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
