package com.enrollnow.study.dtos;

import java.util.List;

public class SaveEmailTemplateRequest {

    private String name;
    private String subject;
    private String description;
    private String message;
    private String design;
    private Boolean messageIsHtml;
    private String replyTo;
    private String senderName;
    private List<String> attachmentFileIds;
    private StudyScheduledActionDto scheduledAction;

    public SaveEmailTemplateRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDesign() {
        return design;
    }

    public void setDesign(String design) {
        this.design = design;
    }

    public Boolean getMessageIsHtml() {
        return messageIsHtml;
    }

    public void setMessageIsHtml(Boolean messageIsHtml) {
        this.messageIsHtml = messageIsHtml;
    }

    public String getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(String replyTo) {
        this.replyTo = replyTo;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public List<String> getAttachmentFileIds() {
        return attachmentFileIds;
    }

    public void setAttachmentFileIds(List<String> attachmentFileIds) {
        this.attachmentFileIds = attachmentFileIds;
    }

    public StudyScheduledActionDto getScheduledAction() {
        return scheduledAction;
    }

    public void setScheduledAction(StudyScheduledActionDto scheduledAction) {
        this.scheduledAction = scheduledAction;
    }
}
