package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateContactPersonRequest {
    private String contactType;
    private String contactValue;
    private String label;
    private String contactName;
    private String relationship;
    private Boolean canLeaveMessage;
    private String notes;
    private Boolean primaryContact;
    private Boolean isPreferred;
    private Boolean active;

    public UpdateContactPersonRequest() {}

    public String getContactType() {
        return contactType;
    }

    public void setContactType(String contactType) {
        this.contactType = contactType;
    }

    public String getContactValue() {
        return contactValue;
    }

    public void setContactValue(String contactValue) {
        this.contactValue = contactValue;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public Boolean getCanLeaveMessage() {
        return canLeaveMessage;
    }

    public void setCanLeaveMessage(Boolean canLeaveMessage) {
        this.canLeaveMessage = canLeaveMessage;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getPrimaryContact() {
        return primaryContact;
    }

    public void setPrimaryContact(Boolean primaryContact) {
        this.primaryContact = primaryContact;
    }

    @JsonIgnore
    public Boolean getIsPreferred() {
        return isPreferred;
    }

    @JsonIgnore
    public void setIsPreferred(Boolean preferred) {
        isPreferred = preferred;
    }

    @JsonProperty("isPreferred")
    @JsonAlias({"preferred"})
    public Boolean getPreferred() {
        return isPreferred;
    }

    @JsonProperty("isPreferred")
    @JsonAlias({"preferred"})
    public void setPreferred(Boolean preferred) {
        isPreferred = preferred;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
