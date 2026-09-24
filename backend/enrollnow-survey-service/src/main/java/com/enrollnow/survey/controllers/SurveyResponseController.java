package com.enrollnow.survey.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.survey.dto.SurveyDtos.SurveyResponseDto;
import com.enrollnow.survey.services.SurveyResponseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "Survey Responses & Submissions", description = "Endpoints for querying survey responses and participant submission records")
@SecurityRequirement(name = "BearerAuth")
public class SurveyResponseController {

    private final SurveyResponseService responseService;

    public SurveyResponseController(SurveyResponseService responseService) {
        this.responseService = responseService;
    }

    @GetMapping({"/api/v1/surveys/{surveyId}/responses", "/api/surveys/{surveyId}/responses"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "List Responses for Survey", description = "Retrieves all submitted response rows for a given survey")
    public ResponseEntity<ApiResponse<List<SurveyResponseDto>>> getResponsesForSurvey(@PathVariable Long surveyId) {
        List<SurveyResponseDto> responses = responseService.getResponsesBySurveyId(surveyId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping({"/api/v1/surveys/me/responses", "/api/me/responses"})
    @Operation(summary = "Get My Submitted Responses", description = "Retrieves survey responses submitted by the authenticated user")
    public ResponseEntity<ApiResponse<List<SurveyResponseDto>>> getMyResponses(@AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : 0L;
        List<SurveyResponseDto> responses = responseService.getMyResponses(userId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping({"/api/v1/surveys/responses/{id}", "/api/responses/{id}"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Get Response by ID", description = "Retrieves full details and answer map for a specific response submission")
    public ResponseEntity<ApiResponse<SurveyResponseDto>> getResponseById(@PathVariable Long id) {
        SurveyResponseDto dto = responseService.getResponseById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
