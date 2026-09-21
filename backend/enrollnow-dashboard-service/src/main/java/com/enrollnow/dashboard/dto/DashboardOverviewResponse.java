package com.enrollnow.dashboard.dto;

import java.util.List;

public class DashboardOverviewResponse {

    private KpiSummaryDto summary;
    private List<StudyOverviewDto> studyOverview;
    private List<PipelineStageDto> recruitmentPipeline;
    private List<RecentActivityDto> recentActivity;
    private List<SystemAlertDto> alerts;

    public DashboardOverviewResponse() {}

    public DashboardOverviewResponse(KpiSummaryDto summary,
                                     List<StudyOverviewDto> studyOverview,
                                     List<PipelineStageDto> recruitmentPipeline,
                                     List<RecentActivityDto> recentActivity,
                                     List<SystemAlertDto> alerts) {
        this.summary = summary;
        this.studyOverview = studyOverview;
        this.recruitmentPipeline = recruitmentPipeline;
        this.recentActivity = recentActivity;
        this.alerts = alerts;
    }

    public KpiSummaryDto getSummary() { return summary; }
    public void setSummary(KpiSummaryDto summary) { this.summary = summary; }

    public List<StudyOverviewDto> getStudyOverview() { return studyOverview; }
    public void setStudyOverview(List<StudyOverviewDto> studyOverview) { this.studyOverview = studyOverview; }

    public List<PipelineStageDto> getRecruitmentPipeline() { return recruitmentPipeline; }
    public void setRecruitmentPipeline(List<PipelineStageDto> recruitmentPipeline) { this.recruitmentPipeline = recruitmentPipeline; }

    public List<RecentActivityDto> getRecentActivity() { return recentActivity; }
    public void setRecentActivity(List<RecentActivityDto> recentActivity) { this.recentActivity = recentActivity; }

    public List<SystemAlertDto> getAlerts() { return alerts; }
    public void setAlerts(List<SystemAlertDto> alerts) { this.alerts = alerts; }
}
