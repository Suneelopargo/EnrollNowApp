package com.enrollnow.study.dtos;

import java.util.List;

public class StudyDisplaySettingsResponse {

    private String studyId;
    private String locale;
    private boolean showGlobalComments;
    private boolean defaultGlobalLogs;
    private boolean statusPageCombinedView;
    private boolean enrolledParticipantColumnsShowEvents;
    private List<ParticipantColumnDto> potentialParticipantColumns;
    private List<ParticipantColumnDto> enrolledParticipantColumns;
    private List<ParticipantColumnDto> availableColumnOptions;
    private List<LocaleOptionDto> supportedLocales;
    private boolean canManage;

    public StudyDisplaySettingsResponse() {
    }

    public String getStudyId() {
        return studyId;
    }

    public void setStudyId(String studyId) {
        this.studyId = studyId;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public boolean isShowGlobalComments() {
        return showGlobalComments;
    }

    public void setShowGlobalComments(boolean showGlobalComments) {
        this.showGlobalComments = showGlobalComments;
    }

    public boolean isDefaultGlobalLogs() {
        return defaultGlobalLogs;
    }

    public void setDefaultGlobalLogs(boolean defaultGlobalLogs) {
        this.defaultGlobalLogs = defaultGlobalLogs;
    }

    public boolean isStatusPageCombinedView() {
        return statusPageCombinedView;
    }

    public void setStatusPageCombinedView(boolean statusPageCombinedView) {
        this.statusPageCombinedView = statusPageCombinedView;
    }

    public boolean isEnrolledParticipantColumnsShowEvents() {
        return enrolledParticipantColumnsShowEvents;
    }

    public void setEnrolledParticipantColumnsShowEvents(boolean enrolledParticipantColumnsShowEvents) {
        this.enrolledParticipantColumnsShowEvents = enrolledParticipantColumnsShowEvents;
    }

    public List<ParticipantColumnDto> getPotentialParticipantColumns() {
        return potentialParticipantColumns;
    }

    public void setPotentialParticipantColumns(List<ParticipantColumnDto> potentialParticipantColumns) {
        this.potentialParticipantColumns = potentialParticipantColumns;
    }

    public List<ParticipantColumnDto> getEnrolledParticipantColumns() {
        return enrolledParticipantColumns;
    }

    public void setEnrolledParticipantColumns(List<ParticipantColumnDto> enrolledParticipantColumns) {
        this.enrolledParticipantColumns = enrolledParticipantColumns;
    }

    public List<ParticipantColumnDto> getAvailableColumnOptions() {
        return availableColumnOptions;
    }

    public void setAvailableColumnOptions(List<ParticipantColumnDto> availableColumnOptions) {
        this.availableColumnOptions = availableColumnOptions;
    }

    public List<LocaleOptionDto> getSupportedLocales() {
        return supportedLocales;
    }

    public void setSupportedLocales(List<LocaleOptionDto> supportedLocales) {
        this.supportedLocales = supportedLocales;
    }

    public boolean isCanManage() {
        return canManage;
    }

    public void setCanManage(boolean canManage) {
        this.canManage = canManage;
    }
}
