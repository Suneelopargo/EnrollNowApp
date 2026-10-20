package com.enrollnow.dashboard.dto;

public class DashboardStudyDto {

    private String id;
    private String studyId;
    private String studyCode;
    private String protocolNumber;
    private String title;
    private String name;
    private String phase;
    private String status;
    private int enrolled;
    private int targetEnrollment;
    private int sitesCount;

    public DashboardStudyDto() {
    }

    public DashboardStudyDto(String id, String studyCode, String title, String phase, String status,
                             int targetEnrollment, int enrolled, int sitesCount) {
        this.id = id;
        this.studyId = id;
        this.studyCode = studyCode;
        this.protocolNumber = studyCode;
        this.title = title;
        this.name = title;
        this.phase = phase;
        this.status = status;
        this.targetEnrollment = targetEnrollment;
        this.enrolled = enrolled;
        this.sitesCount = sitesCount;
    }

    public String getId() { return id; }
    public void setId(String id) {
        this.id = id;
        this.studyId = id;
    }

    public String getStudyId() { return studyId; }
    public void setStudyId(String studyId) { this.studyId = studyId; }

    public String getStudyCode() { return studyCode; }
    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
        this.protocolNumber = studyCode;
    }

    public String getProtocolNumber() { return protocolNumber; }
    public void setProtocolNumber(String protocolNumber) { this.protocolNumber = protocolNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) {
        this.title = title;
        this.name = title;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getEnrolled() { return enrolled; }
    public void setEnrolled(int enrolled) { this.enrolled = enrolled; }

    public int getTargetEnrollment() { return targetEnrollment; }
    public void setTargetEnrollment(int targetEnrollment) { this.targetEnrollment = targetEnrollment; }

    public int getSitesCount() { return sitesCount; }
    public void setSitesCount(int sitesCount) { this.sitesCount = sitesCount; }
}
