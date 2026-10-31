package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ParticipantContactDto {
    private UUID id;
    private UUID participantId;
    private String contactType;
    private String contactValue;
    private String label;
    private String contactName;
    private String relationship;
    private boolean canLeaveMessage;
    private String notes;
    private boolean primaryContact;
    private boolean isPreferred;
    private boolean active;
    private OffsetDateTime createdAt;

    public ParticipantContactDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }
    public String getContactType() { return contactType; }
    public void setContactType(String contactType) { this.contactType = contactType; }
    public String getContactValue() { return contactValue; }
    public void setContactValue(String contactValue) { this.contactValue = contactValue; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public boolean isCanLeaveMessage() { return canLeaveMessage; }
    public void setCanLeaveMessage(boolean canLeaveMessage) { this.canLeaveMessage = canLeaveMessage; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public boolean isPrimaryContact() { return primaryContact; }
    public void setPrimaryContact(boolean primaryContact) { this.primaryContact = primaryContact; }

    @JsonIgnore
    public boolean isPreferred() { return isPreferred; }

    @JsonIgnore
    public void setPreferred(boolean preferred) { isPreferred = preferred; }

    @JsonProperty("isPreferred")
    public boolean getIsPreferred() { return isPreferred; }

    @JsonProperty("isPreferred")
    @JsonAlias({"preferred"})
    public void setIsPreferred(boolean preferred) { isPreferred = preferred; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
