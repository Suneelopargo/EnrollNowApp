package com.enrollnow.study.dtos;

import java.util.List;

public class StudyEmailTextSettingsResponse {

    private String studyId;
    private boolean canManage;
    private boolean textMessagingEnabled;
    private List<StudyEmailTemplateDto> emailTemplates;
    private List<StudyTextTemplateDto> textTemplates;
    private List<StudyBulkTasksResponse.StudyEventOptionDto> events;

    public StudyEmailTextSettingsResponse() {
    }

    public String getStudyId() {
        return studyId;
    }

    public void setStudyId(String studyId) {
        this.studyId = studyId;
    }

    public boolean isCanManage() {
        return canManage;
    }

    public void setCanManage(boolean canManage) {
        this.canManage = canManage;
    }

    public boolean isTextMessagingEnabled() {
        return textMessagingEnabled;
    }

    public void setTextMessagingEnabled(boolean textMessagingEnabled) {
        this.textMessagingEnabled = textMessagingEnabled;
    }

    public List<StudyEmailTemplateDto> getEmailTemplates() {
        return emailTemplates;
    }

    public void setEmailTemplates(List<StudyEmailTemplateDto> emailTemplates) {
        this.emailTemplates = emailTemplates;
    }

    public List<StudyTextTemplateDto> getTextTemplates() {
        return textTemplates;
    }

    public void setTextTemplates(List<StudyTextTemplateDto> textTemplates) {
        this.textTemplates = textTemplates;
    }

    public List<StudyBulkTasksResponse.StudyEventOptionDto> getEvents() {
        return events;
    }

    public void setEvents(List<StudyBulkTasksResponse.StudyEventOptionDto> events) {
        this.events = events;
    }
}
