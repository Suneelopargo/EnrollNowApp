package com.enrollnow.survey.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.survey.dto.SurveyDtos.*;
import com.enrollnow.survey.services.SurveyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/surveys", "/api/surveys"})
@Tag(name = "Survey Studio & Questionnaires", description = "Endpoints for creating, managing, versioning, and publishing clinical study surveys and questionnaires")
@SecurityRequirement(name = "BearerAuth")
public class SurveyController {

    private final SurveyService surveyService;

    public SurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    @GetMapping
    @Operation(summary = "List Surveys & Forms", description = "Retrieves all surveys with optional search and status filtering")
    public ResponseEntity<ApiResponse<List<SurveyListItemDto>>> listSurveys(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        List<SurveyListItemDto> surveys = surveyService.listSurveys(search, status);
        return ResponseEntity.ok(ApiResponse.success(surveys));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Survey Details", description = "Retrieves full survey definition including sections, questions, and logic rules")
    public ResponseEntity<ApiResponse<SurveyDto>> getSurvey(@PathVariable Long id) {
        SurveyDto dto = surveyService.getSurveyById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Create Survey Draft", description = "Creates a new survey draft with sections and questions")
    public ResponseEntity<ApiResponse<SurveyDto>> createSurvey(
            @Valid @RequestBody SurveyCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SurveyDto created = surveyService.createSurvey(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Update Survey", description = "Updates survey metadata, questions, sections, and conditional logic rules")
    public ResponseEntity<ApiResponse<SurveyDto>> updateSurvey(
            @PathVariable Long id,
            @Valid @RequestBody SurveyUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SurveyDto updated = surveyService.updateSurvey(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR')")
    @Operation(summary = "Publish Survey", description = "Validates and transitions survey to PUBLISHED status and creates version snapshot")
    public ResponseEntity<ApiResponse<SurveyDto>> publishSurvey(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SurveyDto published = surveyService.publishSurvey(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(published));
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR')")
    @Operation(summary = "Unpublish Survey", description = "Reverts a published survey back to DRAFT status")
    public ResponseEntity<ApiResponse<SurveyDto>> unpublishSurvey(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SurveyDto draft = surveyService.unpublishSurvey(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(draft));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN')")
    @Operation(summary = "Archive Survey", description = "Archives a survey instrument to prevent further submissions")
    public ResponseEntity<ApiResponse<SurveyDto>> archiveSurvey(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SurveyDto archived = surveyService.archiveSurvey(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(archived));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN')")
    @Operation(summary = "Delete Survey", description = "Permanently deletes a survey instrument and associated entities")
    public ResponseEntity<ApiResponse<Void>> deleteSurvey(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        surveyService.deleteSurvey(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
