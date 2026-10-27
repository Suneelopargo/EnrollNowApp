package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class UpdateContactLogRequest {

    private OffsetDateTime dateTimeOfContact;
    private String contactType;
    private String contactMethod;
    private UUID contactedBy;
    private String spokeTo;
    private String regarding;
    private String outcome;
    private String comments;
    private Boolean sticky;
    private Boolean notify;
    private Boolean global;
    private Boolean lastContact;

    public UpdateContactLogRequest() {
    }

    public OffsetDateTime getDateTimeOfContact() {
        return dateTimeOfContact;
    }

    public void setDateTimeOfContact(OffsetDateTime dateTimeOfContact) {
        this.dateTimeOfContact = dateTimeOfContact;
    }

    public String getContactType() {
        return contactType;
    }

    public void setContactType(String contactType) {
        this.contactType = contactType;
    }

    public String getContactMethod() {
        return contactMethod;
    }

    public void setContactMethod(String contactMethod) {
        this.contactMethod = contactMethod;
    }

    public UUID getContactedBy() {
        return contactedBy;
    }

    public void setContactedBy(UUID contactedBy) {
        this.contactedBy = contactedBy;
    }

    public String getSpokeTo() {
        return spokeTo;
    }

    public void setSpokeTo(String spokeTo) {
        this.spokeTo = spokeTo;
    }

    public String getRegarding() {
        return regarding;
    }

    public void setRegarding(String regarding) {
        this.regarding = regarding;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Boolean getSticky() {
        return sticky;
    }

    public void setSticky(Boolean sticky) {
        this.sticky = sticky;
    }

    public Boolean getNotify() {
        return notify;
    }

    public void setNotify(Boolean notify) {
        this.notify = notify;
    }

    public Boolean getGlobal() {
        return global;
    }

    public void setGlobal(Boolean global) {
        this.global = global;
    }

    public Boolean getLastContact() {
        return lastContact;
    }

    public void setLastContact(Boolean lastContact) {
        this.lastContact = lastContact;
    }
}
