package com.enrollnow.identity.dtos;

import java.util.UUID;

public class StudyNotificationPreferenceDto {

    private UUID studyId;
    private String studyName;
    private String studyCode;
    private String studyRole;
    private String accessRole;
    private boolean dailyDigest;
    private boolean taskEmails;
    private boolean participantEmails;
    private boolean surveySubmissions;

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

    public String getStudyCode() {
        return studyCode;
    }

    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
    }

    public String getStudyRole() {
        return studyRole;
    }

    public void setStudyRole(String studyRole) {
        this.studyRole = studyRole;
    }

    public String getAccessRole() {
        return accessRole;
    }

    public void setAccessRole(String accessRole) {
        this.accessRole = accessRole;
    }

    public boolean isDailyDigest() {
        return dailyDigest;
    }

    public void setDailyDigest(boolean dailyDigest) {
        this.dailyDigest = dailyDigest;
    }

    public boolean isTaskEmails() {
        return taskEmails;
    }

    public void setTaskEmails(boolean taskEmails) {
        this.taskEmails = taskEmails;
    }

    public boolean isParticipantEmails() {
        return participantEmails;
    }

    public void setParticipantEmails(boolean participantEmails) {
        this.participantEmails = participantEmails;
    }

    public boolean isSurveySubmissions() {
        return surveySubmissions;
    }

    public void setSurveySubmissions(boolean surveySubmissions) {
        this.surveySubmissions = surveySubmissions;
    }
}
