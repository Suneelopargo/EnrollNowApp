package com.enrollnow.survey.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.survey.dto.SurveyDtos.SurveyAnalyticsDto;
import com.enrollnow.survey.dto.SurveyDtos.SurveyDashboardDto;
import com.enrollnow.survey.services.SurveyAnalyticsService;
import com.enrollnow.survey.services.SurveyExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Survey Analytics & Intelligence", description = "Endpoints for KPI dashboards, survey analytics metrics, and CSV reporting exports")
@SecurityRequirement(name = "BearerAuth")
public class SurveyAnalyticsController {

    private final SurveyAnalyticsService analyticsService;
    private final SurveyExportService exportService;

    public SurveyAnalyticsController(SurveyAnalyticsService analyticsService, SurveyExportService exportService) {
        this.analyticsService = analyticsService;
        this.exportService = exportService;
    }

    @GetMapping({"/api/v1/surveys/analytics/dashboard", "/api/dashboard"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Get Survey Dashboard Metrics", description = "Retrieves executive counts of surveys, completion rates, and daily submission velocity")
    public ResponseEntity<ApiResponse<SurveyDashboardDto>> getDashboard() {
        SurveyDashboardDto dto = analyticsService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping({"/api/v1/surveys/{surveyId}/analytics", "/api/surveys/{surveyId}/analytics"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Get Specific Survey Analytics", description = "Retrieves completion rate, average rating, and daily breakdown for an individual survey")
    public ResponseEntity<ApiResponse<SurveyAnalyticsDto>> getSurveyAnalytics(@PathVariable Long surveyId) {
        SurveyAnalyticsDto dto = analyticsService.getSurveyAnalytics(surveyId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping({"/api/v1/surveys/{surveyId}/responses/export", "/api/surveys/{surveyId}/responses/export"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Export Survey Responses CSV", description = "Streams a UTF-8 CSV download containing all response answers for the survey")
    public ResponseEntity<byte[]> exportResponsesCsv(@PathVariable Long surveyId) {
        byte[] csvData = exportService.exportResponsesCsv(surveyId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"survey-" + surveyId + "-responses.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
