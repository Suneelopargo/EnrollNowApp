package com.enrollnow.dashboard.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardOverviewResponse {

    private Integer activeStudies;
    private Integer totalStudies;
    private Integer totalParticipants;
    private Integer enrolledParticipants;
    private Integer screeningParticipants;
    private String recruitmentVelocity;
    private Integer pendingTasks;
    private List<DashboardStudyDto> recentStudies = new ArrayList<>();

    private KpiSummaryDto summary;
    private List<DashboardStudyDto> studyOverview = new ArrayList<>();
    private List<PipelineStageDto> recruitmentPipeline = new ArrayList<>();
    private List<RecentActivityDto> recentActivity = new ArrayList<>();
    private List<SystemAlertDto> alerts = new ArrayList<>();

    public DashboardOverviewResponse() {}

    public DashboardOverviewResponse(Integer activeStudies,
                                     Integer totalStudies,
                                     Integer totalParticipants,
                                     Integer enrolledParticipants,
                                     Integer screeningParticipants,
                                     String recruitmentVelocity,
                                     Integer pendingTasks,
                                     List<DashboardStudyDto> recentStudies,
                                     KpiSummaryDto summary,
                                     List<DashboardStudyDto> studyOverview,
                                     List<PipelineStageDto> recruitmentPipeline,
                                     List<RecentActivityDto> recentActivity,
                                     List<SystemAlertDto> alerts) {
        this.activeStudies = activeStudies;
        this.totalStudies = totalStudies;
        this.totalParticipants = totalParticipants;
        this.enrolledParticipants = enrolledParticipants;
        this.screeningParticipants = screeningParticipants;
        this.recruitmentVelocity = recruitmentVelocity;
        this.pendingTasks = pendingTasks;
        this.recentStudies = recentStudies != null ? recentStudies : new ArrayList<>();
        this.summary = summary;
        this.studyOverview = studyOverview != null ? studyOverview : new ArrayList<>();
        this.recruitmentPipeline = recruitmentPipeline != null ? recruitmentPipeline : new ArrayList<>();
        this.recentActivity = recentActivity != null ? recentActivity : new ArrayList<>();
        this.alerts = alerts != null ? alerts : new ArrayList<>();
    }

    public Integer getActiveStudies() { return activeStudies; }
    public void setActiveStudies(Integer activeStudies) { this.activeStudies = activeStudies; }

    public Integer getTotalStudies() { return totalStudies; }
    public void setTotalStudies(Integer totalStudies) { this.totalStudies = totalStudies; }

    public Integer getTotalParticipants() { return totalParticipants; }
    public void setTotalParticipants(Integer totalParticipants) { this.totalParticipants = totalParticipants; }

    public Integer getEnrolledParticipants() { return enrolledParticipants; }
    public void setEnrolledParticipants(Integer enrolledParticipants) { this.enrolledParticipants = enrolledParticipants; }

    public Integer getScreeningParticipants() { return screeningParticipants; }
    public void setScreeningParticipants(Integer screeningParticipants) { this.screeningParticipants = screeningParticipants; }

    public String getRecruitmentVelocity() { return recruitmentVelocity; }
    public void setRecruitmentVelocity(String recruitmentVelocity) { this.recruitmentVelocity = recruitmentVelocity; }

    public Integer getPendingTasks() { return pendingTasks; }
    public void setPendingTasks(Integer pendingTasks) { this.pendingTasks = pendingTasks; }

    public List<DashboardStudyDto> getRecentStudies() { return recentStudies; }
    public void setRecentStudies(List<DashboardStudyDto> recentStudies) { this.recentStudies = recentStudies; }

    public KpiSummaryDto getSummary() { return summary; }
    public void setSummary(KpiSummaryDto summary) { this.summary = summary; }

    public List<DashboardStudyDto> getStudyOverview() { return studyOverview; }
    public void setStudyOverview(List<DashboardStudyDto> studyOverview) { this.studyOverview = studyOverview; }

    public List<PipelineStageDto> getRecruitmentPipeline() { return recruitmentPipeline; }
    public void setRecruitmentPipeline(List<PipelineStageDto> recruitmentPipeline) { this.recruitmentPipeline = recruitmentPipeline; }

    public List<RecentActivityDto> getRecentActivity() { return recentActivity; }
    public void setRecentActivity(List<RecentActivityDto> recentActivity) { this.recentActivity = recentActivity; }

    public List<SystemAlertDto> getAlerts() { return alerts; }
    public void setAlerts(List<SystemAlertDto> alerts) { this.alerts = alerts; }
}
