package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;

public class UpdateConsentLogRequest {

    private OffsetDateTime consentDate;
    private String consentType;
    private String consentTitle;
    private String consentedBy;
    private String version;
    private OffsetDateTime expiration;
    private String comments;

    private Boolean sticky;
    private Boolean notify;
    private Boolean global;
    private Boolean lastContact;

    private Boolean removeAttachment;

    public UpdateConsentLogRequest() {
    }

    public OffsetDateTime getConsentDate() {
        return consentDate;
    }

    public void setConsentDate(OffsetDateTime consentDate) {
        this.consentDate = consentDate;
    }

    public String getConsentType() {
        return consentType;
    }

    public void setConsentType(String consentType) {
        this.consentType = consentType;
    }

    public String getConsentTitle() {
        return consentTitle;
    }

    public void setConsentTitle(String consentTitle) {
        this.consentTitle = consentTitle;
    }

    public String getConsentedBy() {
        return consentedBy;
    }

    public void setConsentedBy(String consentedBy) {
        this.consentedBy = consentedBy;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public OffsetDateTime getExpiration() {
        return expiration;
    }

    public void setExpiration(OffsetDateTime expiration) {
        this.expiration = expiration;
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

    public Boolean getRemoveAttachment() {
        return removeAttachment;
    }

    public void setRemoveAttachment(Boolean removeAttachment) {
        this.removeAttachment = removeAttachment;
    }
}
