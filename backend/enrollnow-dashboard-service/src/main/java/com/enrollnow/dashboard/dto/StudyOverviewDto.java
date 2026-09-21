package com.enrollnow.dashboard.dto;

public class StudyOverviewDto {
    private String studyId;
    private String protocolNumber;
    private String title;
    private String phase;
    private String status;
    private int targetEnrollment;
    private int currentEnrolled;
    private int siteCount;

    public StudyOverviewDto() {}

    public StudyOverviewDto(String studyId, String protocolNumber, String title, String phase,
                            String status, int targetEnrollment, int currentEnrolled, int siteCount) {
        this.studyId = studyId;
        this.protocolNumber = protocolNumber;
        this.title = title;
        this.phase = phase;
        this.status = status;
        this.targetEnrollment = targetEnrollment;
        this.currentEnrolled = currentEnrolled;
        this.siteCount = siteCount;
    }

    public String getStudyId() { return studyId; }
    public void setStudyId(String studyId) { this.studyId = studyId; }

    public String getProtocolNumber() { return protocolNumber; }
    public void setProtocolNumber(String protocolNumber) { this.protocolNumber = protocolNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getTargetEnrollment() { return targetEnrollment; }
    public void setTargetEnrollment(int targetEnrollment) { this.targetEnrollment = targetEnrollment; }

    public int getCurrentEnrolled() { return currentEnrolled; }
    public void setCurrentEnrolled(int currentEnrolled) { this.currentEnrolled = currentEnrolled; }

    public int getSiteCount() { return siteCount; }
    public void setSiteCount(int siteCount) { this.siteCount = siteCount; }
}
