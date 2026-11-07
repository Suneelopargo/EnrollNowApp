package com.enrollnow.notification.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CreateTaskRequest {

    private UUID studyId;
    private UUID participantId;

    @NotBlank(message = "Title must not be blank")
    private String title;

    private String description;
    private String type;
    private String category;
    private Instant dueAt;
    private String dueDate;
    private List<UUID> assignedUserIds;

    public CreateTaskRequest() {
    }

    public CreateTaskRequest(UUID studyId, UUID participantId, String title, String description, String type, Instant dueAt, List<UUID> assignedUserIds) {
        this.studyId = studyId;
        this.participantId = participantId;
        this.title = title;
        this.description = description;
        this.type = type;
        this.dueAt = dueAt;
        this.assignedUserIds = assignedUserIds;
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

    public String getType() {
        return type != null ? type : category;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category != null ? category : type;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public List<UUID> getAssignedUserIds() {
        return assignedUserIds;
    }

    public void setAssignedUserIds(List<UUID> assignedUserIds) {
        this.assignedUserIds = assignedUserIds;
    }
}
