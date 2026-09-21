package com.enrollnow.survey.controllers;

import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/surveys")
@Tag(name = "Surveys & eConsent", description = "Endpoints for electronic informed consent forms, screening questionnaires, and responses")
@SecurityRequirement(name = "BearerAuth")
public class SurveyController {

    @GetMapping
    @Operation(summary = "List Surveys & Forms")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSurveys() {
        List<Map<String, Object>> surveys = List.of(
                Map.of(
                        "id", "SRV-101",
                        "title", "Cardiovascular Trial eConsent Form (v2.1)",
                        "type", "ECONSENT",
                        "studyId", "ST-101",
                        "status", "PUBLISHED",
                        "version", "2.1"
                ),
                Map.of(
                        "id", "SRV-102",
                        "title", "Initial Eligibility Pre-Screening Questionnaire",
                        "type", "SCREENING",
                        "studyId", "ST-101",
                        "status", "PUBLISHED",
                        "version", "1.0"
                )
        );
        return ResponseEntity.ok(ApiResponse.success(surveys));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Survey Service Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-survey-service",
                "status", "OPERATIONAL",
                "capabilities", "Survey Studio, Dynamic Questions, eConsent, Response Collection"
        )));
    }
}
