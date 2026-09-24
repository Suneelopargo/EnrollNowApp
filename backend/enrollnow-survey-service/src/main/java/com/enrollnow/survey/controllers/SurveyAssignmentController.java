package com.enrollnow.survey.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.survey.dto.SurveyDtos.CreateAssignmentRequest;
import com.enrollnow.survey.dto.SurveyDtos.SurveyAssignmentDto;
import com.enrollnow.survey.services.SurveyAssignmentService;
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
@Tag(name = "Survey Assignments", description = "Endpoints for assigning surveys to clinical trial participants and tracking assigned queues")
@SecurityRequirement(name = "BearerAuth")
public class SurveyAssignmentController {

    private final SurveyAssignmentService assignmentService;

    public SurveyAssignmentController(SurveyAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping({"/api/v1/surveys/assignments", "/api/assignments"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "List Survey Assignments", description = "Retrieves all participant survey assignments with optional surveyId filter")
    public ResponseEntity<ApiResponse<List<SurveyAssignmentDto>>> listAssignments(
            @RequestParam(required = false) Long surveyId) {
        List<SurveyAssignmentDto> assignments = assignmentService.listAssignments(surveyId);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }

    @PostMapping({"/api/v1/surveys/assignments", "/api/assignments"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Assign Survey to User", description = "Creates a new survey assignment record for a participant or user")
    public ResponseEntity<ApiResponse<SurveyAssignmentDto>> assignSurvey(
            @Valid @RequestBody CreateAssignmentRequest request) {
        SurveyAssignmentDto created = assignmentService.assignSurvey(request);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @DeleteMapping({"/api/v1/surveys/assignments/{id}", "/api/assignments/{id}"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Revoke Survey Assignment", description = "Removes a survey assignment record")
    public ResponseEntity<ApiResponse<Void>> unassignSurvey(@PathVariable Long id) {
        assignmentService.unassignSurvey(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping({"/api/v1/surveys/me/assigned", "/api/me/assigned-surveys"})
    @Operation(summary = "Get My Assigned Surveys", description = "Retrieves pending and active surveys assigned to the current user")
    public ResponseEntity<ApiResponse<List<SurveyAssignmentDto>>> getMyAssignedSurveys(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : 0L;
        List<SurveyAssignmentDto> assignments = assignmentService.getMyAssignedSurveys(userId);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }
}
