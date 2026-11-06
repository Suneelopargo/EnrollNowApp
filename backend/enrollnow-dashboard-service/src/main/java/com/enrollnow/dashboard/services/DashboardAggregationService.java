package com.enrollnow.dashboard.services;

import com.enrollnow.dashboard.dto.*;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DashboardAggregationService {

    private final Optional<StudyRepository> studyRepository;
    private final Optional<SiteAuthorizationService> siteAuthorizationService;

    public DashboardAggregationService() {
        this.studyRepository = Optional.empty();
        this.siteAuthorizationService = Optional.empty();
    }

    public DashboardAggregationService(Optional<StudyRepository> studyRepository) {
        this(studyRepository, Optional.empty());
    }

    @Autowired
    public DashboardAggregationService(
            Optional<StudyRepository> studyRepository,
            Optional<SiteAuthorizationService> siteAuthorizationService
    ) {
        this.studyRepository = studyRepository != null ? studyRepository : Optional.empty();
        this.siteAuthorizationService = siteAuthorizationService != null ? siteAuthorizationService : Optional.empty();
    }

    public DashboardOverviewResponse getOverview() {
        List<DashboardStudyDto> studies = new ArrayList<>();

        if (studyRepository.isPresent()) {
            List<Study> dbStudies;
            if (siteAuthorizationService.isPresent()) {
                SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.get()
                        .getAuthenticatedCaller()
                        .orElseThrow(() -> new org.springframework.security.authentication.InsufficientAuthenticationException(
                                "Authentication is required to access dashboard overview"));
                if (caller.tenantId() == null) {
                    throw new AccessDeniedException("Access denied: authenticated caller has no tenant context");
                }
                dbStudies = studyRepository.get().findByTenantId(caller.tenantId());
            } else {
                dbStudies = studyRepository.get().findAll();
            }

            if (dbStudies != null && !dbStudies.isEmpty()) {
                for (Study s : dbStudies) {
                    int target = s.getSampleSize() != null ? s.getSampleSize() : 0;
                    int enrolled = 0;
                    String status = s.isArchived() ? "COMPLETED" : "ACTIVE";
                    studies.add(new DashboardStudyDto(
                            s.getId() != null ? s.getId().toString() : (s.getStudyCode() != null ? s.getStudyCode() : ""),
                            s.getStudyCode() != null ? s.getStudyCode() : "",
                            s.getName() != null ? s.getName() : "",
                            null,
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
