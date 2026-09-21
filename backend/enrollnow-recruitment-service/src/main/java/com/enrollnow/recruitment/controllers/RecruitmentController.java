package com.enrollnow.recruitment.controllers;

import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recruitment")
@Tag(name = "Recruitment & Funnel", description = "Endpoints for recruitment campaigns, outreach channels, and conversion metrics")
@SecurityRequirement(name = "BearerAuth")
public class RecruitmentController {

    @GetMapping("/campaigns")
    @Operation(summary = "List Active Recruitment Campaigns")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCampaigns() {
        List<Map<String, Object>> campaigns = List.of(
                Map.of(
                        "id", "CMP-101",
                        "name", "Cardiovascular Digital Screening Campaign",
                        "studyId", "ST-101",
                        "channel", "Digital / Community Outreach",
                        "targetCandidates", 1000,
                        "screenedCount", 380,
                        "status", "ACTIVE"
                )
        );
        return ResponseEntity.ok(ApiResponse.success(campaigns));
    }

    @GetMapping("/pipeline")
    @Operation(summary = "Get Recruitment Funnel Pipeline")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPipeline() {
        List<Map<String, Object>> pipeline = List.of(
                Map.of("stage", "Identified", "count", 2400),
                Map.of("stage", "Contacted", "count", 1850),
                Map.of("stage", "Prescreened", "count", 920),
                Map.of("stage", "Consented", "count", 610),
                Map.of("stage", "Enrolled", "count", 480)
        );
        return ResponseEntity.ok(ApiResponse.success(pipeline));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Recruitment Service Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-recruitment-service",
                "status", "OPERATIONAL",
                "capabilities", "Campaigns, Screening Funnels, Referrals"
        )));
    }
}
