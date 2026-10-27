package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ParticipantCommentDto {
    private UUID id;
    private UUID participantId;
    private UUID studyId;
    private String text;
    private boolean pinned;
    private boolean global;
    private UUID authorId;
    private String authorName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public ParticipantCommentDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) { this.studyId = studyId; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public boolean isGlobal() { return global; }
    public void setGlobal(boolean global) { this.global = global; }
    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
