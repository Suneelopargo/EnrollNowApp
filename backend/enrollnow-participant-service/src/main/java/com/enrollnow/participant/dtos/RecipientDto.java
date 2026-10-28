package com.enrollnow.participant.dtos;

import java.util.UUID;

public class RecipientDto {
    private UUID id;
    private String recipientType; // TO, CC, BCC
    private String recipientName;
    private String recipientValue;

    public RecipientDto() {}

    public RecipientDto(UUID id, String recipientType, String recipientName, String recipientValue) {
        this.id = id;
        this.recipientType = recipientType;
        this.recipientName = recipientName;
        this.recipientValue = recipientValue;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getRecipientType() { return recipientType; }
    public void setRecipientType(String recipientType) { this.recipientType = recipientType; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getRecipientValue() { return recipientValue; }
    public void setRecipientValue(String recipientValue) { this.recipientValue = recipientValue; }
}
