package com.enrollnow.dashboard.dto;

public class KpiSummaryDto {
    private int activeStudiesCount;
    private int totalParticipantsCount;
    private int pendingScreeningCount;
    private int enrolledThisMonthCount;
    private int activeSitesCount;
    private int taskAlertsCount;

    public KpiSummaryDto() {}

    public KpiSummaryDto(int activeStudiesCount, int totalParticipantsCount, int pendingScreeningCount,
                         int enrolledThisMonthCount, int activeSitesCount, int taskAlertsCount) {
        this.activeStudiesCount = activeStudiesCount;
        this.totalParticipantsCount = totalParticipantsCount;
        this.pendingScreeningCount = pendingScreeningCount;
        this.enrolledThisMonthCount = enrolledThisMonthCount;
        this.activeSitesCount = activeSitesCount;
        this.taskAlertsCount = taskAlertsCount;
    }

    public int getActiveStudiesCount() { return activeStudiesCount; }
    public void setActiveStudiesCount(int activeStudiesCount) { this.activeStudiesCount = activeStudiesCount; }

    public int getTotalParticipantsCount() { return totalParticipantsCount; }
    public void setTotalParticipantsCount(int totalParticipantsCount) { this.totalParticipantsCount = totalParticipantsCount; }

    public int getPendingScreeningCount() { return pendingScreeningCount; }
    public void setPendingScreeningCount(int pendingScreeningCount) { this.pendingScreeningCount = pendingScreeningCount; }

    public int getEnrolledThisMonthCount() { return enrolledThisMonthCount; }
    public void setEnrolledThisMonthCount(int enrolledThisMonthCount) { this.enrolledThisMonthCount = enrolledThisMonthCount; }

    public int getActiveSitesCount() { return activeSitesCount; }
    public void setActiveSitesCount(int activeSitesCount) { this.activeSitesCount = activeSitesCount; }

    public int getTaskAlertsCount() { return taskAlertsCount; }
    public void setTaskAlertsCount(int taskAlertsCount) { this.taskAlertsCount = taskAlertsCount; }
}
