package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ParticipantContactLogDto {

    private UUID id;
    private UUID tenantId;
    private UUID participantId;
    private UUID studyId;
    private String studyName;
    private OffsetDateTime dateTimeOfContact;
    private String formattedDateTime;
    private String contactType;
    private String contactMethod;
    private UUID contactedBy;
    private String contactedByName;
    private String spokeTo;
    private String regarding;
    private String outcome;
    private String comments;
    private boolean sticky;
    private boolean notify;
    private boolean global;
    private boolean lastContact;
    private OffsetDateTime createdAt;
    private UUID createdBy;
    private String createdByName;
    private String createdByInitials;
    private OffsetDateTime updatedAt;
    private UUID updatedBy;
    private String updatedByName;
    private String updatedByInitials;
    private boolean editable;
    private boolean pinnable;

    public ParticipantContactLogDto() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public String getStudyName() {
        return studyName;
    }

    public void setStudyName(String studyName) {
        this.studyName = studyName;
    }

    public OffsetDateTime getDateTimeOfContact() {
        return dateTimeOfContact;
    }

    public void setDateTimeOfContact(OffsetDateTime dateTimeOfContact) {
        this.dateTimeOfContact = dateTimeOfContact;
    }

    public String getFormattedDateTime() {
        return formattedDateTime;
    }

    public void setFormattedDateTime(String formattedDateTime) {
        this.formattedDateTime = formattedDateTime;
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

    public String getContactedByName() {
        return contactedByName;
    }

    public void setContactedByName(String contactedByName) {
        this.contactedByName = contactedByName;
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

    public boolean isSticky() {
        return sticky;
    }

    public void setSticky(boolean sticky) {
        this.sticky = sticky;
    }

    public boolean isNotify() {
        return notify;
    }

    public void setNotify(boolean notify) {
        this.notify = notify;
    }

    public boolean isGlobal() {
        return global;
    }

    public void setGlobal(boolean global) {
        this.global = global;
    }

    public boolean isLastContact() {
        return lastContact;
    }

    public void setLastContact(boolean lastContact) {
        this.lastContact = lastContact;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public String getCreatedByInitials() {
        return createdByInitials;
    }

    public void setCreatedByInitials(String createdByInitials) {
        this.createdByInitials = createdByInitials;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }

    public String getUpdatedByName() {
        return updatedByName;
    }

    public void setUpdatedByName(String updatedByName) {
        this.updatedByName = updatedByName;
    }

    public String getUpdatedByInitials() {
        return updatedByInitials;
    }

    public void setUpdatedByInitials(String updatedByInitials) {
        this.updatedByInitials = updatedByInitials;
    }

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }

    public boolean isPinnable() {
        return pinnable;
    }

    public void setPinnable(boolean pinnable) {
        this.pinnable = pinnable;
    }
}
