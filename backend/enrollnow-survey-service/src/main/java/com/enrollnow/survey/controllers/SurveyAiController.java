package com.enrollnow.survey.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.survey.dto.SurveyDtos.*;
import com.enrollnow.survey.services.SurveyAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "AI Survey Assistant & Logic Co-Pilot", description = "Endpoints for prompt-based survey generation, conditional logic suggestions, and response clinical assessment")
@SecurityRequirement(name = "BearerAuth")
public class SurveyAiController {

    private final SurveyAiService aiService;

    public SurveyAiController(SurveyAiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping({"/api/v1/surveys/ai/generate", "/api/ai/generate", "/api/ai/generate-survey"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Generate Survey from Prompt", description = "Generates clinical survey structure, sections, questions, and logic rules from a text prompt")
    public ResponseEntity<ApiResponse<AiGenerateResponse>> generateSurvey(@Valid @RequestBody AiGenerateRequest request) {
        AiGenerateResponse response = aiService.generateSurvey(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping({"/api/v1/surveys/ai/suggest-logic", "/api/ai/suggest-logic"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Suggest Conditional Logic Rules", description = "Analyzes a list of questions and suggests optimal skip/branching rules")
    public ResponseEntity<ApiResponse<AiLogicSuggestionResponse>> suggestLogic(@RequestBody AiLogicSuggestionRequest request) {
        AiLogicSuggestionResponse response = aiService.suggestLogic(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping({"/api/v1/surveys/responses/{responseId}/assess", "/api/responses/{responseId}/assess"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN', 'INVESTIGATOR', 'COORDINATOR')")
    @Operation(summary = "Assess Participant Response", description = "Runs AI clinical sentiment analysis and safety flag evaluation on submitted responses")
    public ResponseEntity<ApiResponse<AiResponseAssessmentDto>> assessResponse(@PathVariable Long responseId) {
        AiResponseAssessmentDto dto = aiService.assessResponse(responseId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
