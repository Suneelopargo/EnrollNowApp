package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public class CreateContactLogRequest {

    @NotNull(message = "Contact Date/Time is required")
    private OffsetDateTime dateTimeOfContact;

    @NotBlank(message = "Contact Type is required")
    private String contactType;

    private String contactMethod;

    @NotNull(message = "Contacted By is required")
    private UUID contactedBy;

    private String spokeTo;

    private String regarding;

    @NotBlank(message = "Outcome is required")
    private String outcome;

    private String comments;

    private Boolean sticky = false;

    private Boolean notify = false;

    private Boolean global = true;

    private Boolean lastContact = true;

    private UUID studyId;
    private String studyIdentifier;

    public CreateContactLogRequest() {
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

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
        if (studyId != null) {
            this.studyIdentifier = studyId.toString();
        }
    }

    @JsonSetter("studyId")
    public void setStudyIdFromRaw(Object raw) {
        if (raw == null) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        String str = raw.toString().trim();
        if (str.isEmpty()) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        try {
            this.studyId = UUID.fromString(str);
            this.studyIdentifier = str;
        } catch (IllegalArgumentException e) {
            this.studyId = null;
            this.studyIdentifier = str;
        }
    }

    public String getStudyIdentifier() {
        return studyIdentifier;
    }

    public void setStudyIdentifier(String studyIdentifier) {
        this.studyIdentifier = studyIdentifier;
    }
}
