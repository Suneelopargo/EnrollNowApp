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
    private Instant dueAt;
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
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
    }

    public List<UUID> getAssignedUserIds() {
        return assignedUserIds;
    }

    public void setAssignedUserIds(List<UUID> assignedUserIds) {
        this.assignedUserIds = assignedUserIds;
    }
}
