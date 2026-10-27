package com.enrollnow.participant.dtos;

import jakarta.validation.constraints.NotBlank;

public class CreateContactPersonRequest {
    @NotBlank(message = "Contact type is required (e.g. PHONE, EMAIL, SMS)")
    private String contactType;

    @NotBlank(message = "Contact value is required")
    private String contactValue;

    private String label;
    private String contactName;
    private String relationship;
    private boolean canLeaveMessage = true;
    private String notes;
    private boolean primaryContact = false;
    private boolean isPreferred = false;

    public CreateContactPersonRequest() {}

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
    public boolean isPreferred() { return isPreferred; }
    public void setPreferred(boolean preferred) { isPreferred = preferred; }
}
