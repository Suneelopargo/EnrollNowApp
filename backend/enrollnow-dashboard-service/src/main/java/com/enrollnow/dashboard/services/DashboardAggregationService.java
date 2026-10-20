package com.enrollnow.dashboard.services;

import com.enrollnow.dashboard.dto.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DashboardAggregationService {

    private final Optional<StudyRepository> studyRepository;

    public DashboardAggregationService() {
        this.studyRepository = Optional.empty();
    }

    @Autowired
    public DashboardAggregationService(Optional<StudyRepository> studyRepository) {
        this.studyRepository = studyRepository != null ? studyRepository : Optional.empty();
    }

    public DashboardOverviewResponse getOverview() {
        List<DashboardStudyDto> studies = new ArrayList<>();

        if (studyRepository.isPresent()) {
            List<Study> dbStudies = studyRepository.get().findAll();
            if (dbStudies != null && !dbStudies.isEmpty()) {
                for (Study s : dbStudies) {
                    int target = s.getSampleSize() != null ? s.getSampleSize() : 0;
                    int enrolled = 0;
                    String status = s.isArchived() ? "COMPLETED" : "ACTIVE";
                    studies.add(new DashboardStudyDto(
                            s.getId() != null ? s.getId().toString() : (s.getStudyCode() != null ? s.getStudyCode() : "N/A"),
                            s.getStudyCode() != null ? s.getStudyCode() : "N/A",
                            s.getName() != null ? s.getName() : "Untitled Study",
                            "Phase II/III",
                            status,
                            target,
                            enrolled,
                            0
                    ));
                }
            }
        }

        int totalStudiesCount = studies.size();
        int activeStudiesCount = (int) studies.stream()
                .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()) || "RECRUITING".equalsIgnoreCase(s.getStatus()))
                .count();
        int enrolledCount = studies.stream().mapToInt(DashboardStudyDto::getEnrolled).sum();
        int totalParticipantsCount = enrolledCount;
        int screeningCount = 0;

        KpiSummaryDto summary = new KpiSummaryDto(
                activeStudiesCount,
                totalParticipantsCount,
                screeningCount,
                0,
                0,
                0
        );

        List<PipelineStageDto> pipeline = List.of();
        List<RecentActivityDto> activity = List.of();
        List<SystemAlertDto> alerts = List.of();

        return new DashboardOverviewResponse(
                activeStudiesCount,
                totalStudiesCount,
                totalParticipantsCount,
                enrolledCount,
                screeningCount,
                totalStudiesCount > 0 ? "0%" : "--",
                0,
                studies,
                summary,
                studies,
                pipeline,
                activity,
                alerts
        );
    }
}
