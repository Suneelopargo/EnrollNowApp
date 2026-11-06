package com.enrollnow.identity.dtos;

public class UpdateStudyNotificationPreferenceRequest {

    private Boolean dailyDigest;
    private Boolean taskEmails;
    private Boolean participantEmails;
    private Boolean surveySubmissions;

    public Boolean getDailyDigest() {
        return dailyDigest;
    }

    public void setDailyDigest(Boolean dailyDigest) {
        this.dailyDigest = dailyDigest;
    }

    public Boolean getTaskEmails() {
        return taskEmails;
    }

    public void setTaskEmails(Boolean taskEmails) {
        this.taskEmails = taskEmails;
    }

    public Boolean getParticipantEmails() {
        return participantEmails;
    }

    public void setParticipantEmails(Boolean participantEmails) {
        this.participantEmails = participantEmails;
    }

    public Boolean getSurveySubmissions() {
        return surveySubmissions;
    }

    public void setSurveySubmissions(Boolean surveySubmissions) {
        this.surveySubmissions = surveySubmissions;
    }
}
