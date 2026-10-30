package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SendEmailRequest {
    @NotEmpty(message = "At least one recipient (To) is required")
    private List<String> to = new ArrayList<>();
    private List<String> cc = new ArrayList<>();
    private List<String> bcc = new ArrayList<>();

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Email body is required")
    private String body;

    private String replyTo;
    private String senderName;
    private boolean pinned = false;
    private boolean lastContact = false;
    private boolean global = false;
    private boolean notify = false;
    private String design;
    private boolean messageIsHtml = false;
    private List<String> attachments = new ArrayList<>();
    private UUID studyId;
    private String studyIdentifier;

    public SendEmailRequest() {}

    public List<String> getTo() { return to; }
    public void setTo(List<String> to) { this.to = to; }
    public List<String> getCc() { return cc; }
    public void setCc(List<String> cc) { this.cc = cc; }
    public List<String> getBcc() { return bcc; }
    public void setBcc(List<String> bcc) { this.bcc = bcc; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getReplyTo() { return replyTo; }
    public void setReplyTo(String replyTo) { this.replyTo = replyTo; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public boolean isSticky() { return pinned; }
    public void setSticky(boolean sticky) { this.pinned = sticky; }
    public boolean isLastContact() { return lastContact; }
    public void setLastContact(boolean lastContact) { this.lastContact = lastContact; }
    public boolean isGlobal() { return global; }
    public void setGlobal(boolean global) { this.global = global; }
    public boolean isNotify() { return notify; }
    public void setNotify(boolean notify) { this.notify = notify; }
    public String getDesign() { return design; }
    public void setDesign(String design) { this.design = design; }
    public boolean isMessageIsHtml() { return messageIsHtml; }
    public void setMessageIsHtml(boolean messageIsHtml) { this.messageIsHtml = messageIsHtml; }
    public List<String> getAttachments() { return attachments; }
    public void setAttachments(List<String> attachments) { this.attachments = attachments != null ? attachments : new ArrayList<>(); }
    public UUID getStudyId() { return studyId; }
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
