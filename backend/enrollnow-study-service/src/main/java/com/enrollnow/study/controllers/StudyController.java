package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/studies")
@Tag(name = "Study Management", description = "Endpoints for clinical trials, protocol definitions, and trial operational statuses")
@SecurityRequirement(name = "BearerAuth")
public class StudyController {

    @GetMapping
    @Operation(summary = "List Studies", description = "Retrieves clinical trials and studies registered within the platform.")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudies() {
        List<Map<String, Object>> demoStudies = List.of(
                Map.of(
                        "id", "ST-101",
                        "protocolNumber", "EN-CARD-2026",
                        "title", "Cardiovascular Phase III Clinical Trial",
                        "phase", "Phase III",
                        "status", "RECRUITING",
                        "targetEnrollment", 500,
                        "currentEnrolled", 342,
                        "siteCount", 12
                ),
                Map.of(
                        "id", "ST-102",
                        "protocolNumber", "EN-ONCO-2026",
                        "title", "Oncology Targeted Biomarker Investigation",
                        "phase", "Phase II",
                        "status", "ACTIVE_ENROLLING",
                        "targetEnrollment", 250,
                        "currentEnrolled", 115,
                        "siteCount", 8
                )
        );
        return ResponseEntity.ok(ApiResponse.success("Studies retrieved successfully", demoStudies));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Study Details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudy(@PathVariable String id) {
        Map<String, Object> study = Map.of(
                "id", id,
                "protocolNumber", "EN-CARD-2026",
                "title", "Cardiovascular Phase III Clinical Trial",
                "description", "Foundation clinical trial protocol definition.",
                "phase", "Phase III",
                "status", "RECRUITING"
        );
        return ResponseEntity.ok(ApiResponse.success(study));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Study Service Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-study-service",
                "status", "OPERATIONAL",
                "capabilities", "Study Protocols, Site Links, Inclusion/Exclusion"
        )));
    }
}
