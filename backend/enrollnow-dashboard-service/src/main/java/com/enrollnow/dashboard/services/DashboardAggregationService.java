package com.enrollnow.dashboard.services;

import com.enrollnow.dashboard.dto.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardAggregationService {

    public DashboardOverviewResponse getOverview() {
        KpiSummaryDto summary = new KpiSummaryDto(
                14,
                12850,
                342,
                184,
                28,
                9
        );

        List<StudyOverviewDto> studies = List.of(
                new StudyOverviewDto("ST-101", "EN-CARD-2026", "Cardiovascular Trial (Demo Protocol)", "Phase III", "RECRUITING", 500, 342, 12),
                new StudyOverviewDto("ST-102", "EN-ONCO-2026", "Oncology Biomarker Investigation (Demo)", "Phase II", "ACTIVE_ENROLLING", 250, 115, 8),
                new StudyOverviewDto("ST-103", "EN-NEURO-2026", "Neurology Early Intervention Study (Demo)", "Phase I/II", "ACTIVE_ENROLLING", 120, 64, 4),
                new StudyOverviewDto("ST-104", "EN-IMMUNO-2026", "Immunotherapy Response Cohort (Demo)", "Phase II", "SUSPENDED", 300, 180, 6)
        );

        List<PipelineStageDto> pipeline = List.of(
                new PipelineStageDto("Identified", 2400),
                new PipelineStageDto("Contacted", 1850),
                new PipelineStageDto("Prescreened", 920),
                new PipelineStageDto("Consented", 610),
                new PipelineStageDto("Enrolled", 480)
        );

        List<RecentActivityDto> activity = List.of(
                new RecentActivityDto(1L, "PARTICIPANT_ENROLLED", "Participant EN-8842 consented at Boston CRC", "10 minutes ago", "coord_smith"),
                new RecentActivityDto(2L, "CONSENT_SIGNED", "eConsent form v2.1 submitted for candidate EN-8849", "35 minutes ago", "participant_direct"),
                new RecentActivityDto(3L, "SCREENING_PASSED", "Prescreening criteria validated for EN-8850", "1 hour ago", "ai_screening_engine"),
                new RecentActivityDto(4L, "STUDY_AMENDMENT", "Protocol amendment v3.0 approved by IRB", "3 hours ago", "reg_officer_jones")
        );

        List<SystemAlertDto> alerts = List.of(
                new SystemAlertDto("ALT-01", "WARNING", "Site SITE-004 recruitment pace is 15% below target", "Today at 08:30"),
                new SystemAlertDto("ALT-02", "INFO", "Quarterly IRB compliance report generated and ready for review", "Yesterday at 16:00"),
                new SystemAlertDto("ALT-03", "WARNING", "5 pending prescreening tasks due within 24 hours", "Today at 09:15")
        );

        return new DashboardOverviewResponse(summary, studies, pipeline, activity, alerts);
    }
}
