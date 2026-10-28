package com.enrollnow.study.dtos;

import java.util.List;

public class UpdateStudyDisplaySettingsRequest {

    private String locale;
    private Boolean showGlobalComments;
    private Boolean defaultGlobalLogs;
    private Boolean statusPageCombinedView;
    private Boolean enrolledParticipantColumnsShowEvents;
    private List<ParticipantColumnDto> potentialParticipantColumns;
    private List<ParticipantColumnDto> enrolledParticipantColumns;

    public UpdateStudyDisplaySettingsRequest() {
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public Boolean getShowGlobalComments() {
        return showGlobalComments;
    }

    public void setShowGlobalComments(Boolean showGlobalComments) {
        this.showGlobalComments = showGlobalComments;
    }

    public Boolean getDefaultGlobalLogs() {
        return defaultGlobalLogs;
    }

    public void setDefaultGlobalLogs(Boolean defaultGlobalLogs) {
        this.defaultGlobalLogs = defaultGlobalLogs;
    }

    public Boolean getStatusPageCombinedView() {
        return statusPageCombinedView;
    }

    public void setStatusPageCombinedView(Boolean statusPageCombinedView) {
        this.statusPageCombinedView = statusPageCombinedView;
    }

    public Boolean getEnrolledParticipantColumnsShowEvents() {
        return enrolledParticipantColumnsShowEvents;
    }

    public void setEnrolledParticipantColumnsShowEvents(Boolean enrolledParticipantColumnsShowEvents) {
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
}
