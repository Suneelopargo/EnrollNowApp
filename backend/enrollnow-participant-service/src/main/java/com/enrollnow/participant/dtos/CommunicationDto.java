package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CommunicationDto {
    private UUID id;
    private UUID participantId;
    private UUID studyId;
    private String studyName;
    private boolean global = true;
    private String channel;
    private String direction;
    private String subject;
    private String body;
    private String status;
    private OffsetDateTime sentAt;
    private OffsetDateTime createdAt;
    private boolean pinned;
    private String senderName;
    private List<RecipientDto> recipients = new ArrayList<>();

    public CommunicationDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) { this.studyId = studyId; }
    public String getStudyName() { return studyName; }
    public void setStudyName(String studyName) { this.studyName = studyName; }
    public boolean isGlobal() { return global; }
    public void setGlobal(boolean global) { this.global = global; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getSentAt() { return sentAt; }
    public void setSentAt(OffsetDateTime sentAt) { this.sentAt = sentAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public List<RecipientDto> getRecipients() { return recipients; }
    public void setRecipients(List<RecipientDto> recipients) { this.recipients = recipients; }
}
