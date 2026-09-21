package com.enrollnow.participant.controllers;

import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/participants")
@Tag(name = "Participant Registry", description = "Endpoints for participant master index, demographics, and screening queues")
@SecurityRequirement(name = "BearerAuth")
public class ParticipantController {

    @GetMapping
    @Operation(summary = "List Participants", description = "Retrieves participant registry queue.")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParticipants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        List<Map<String, Object>> participants = List.of(
                Map.of(
                        "id", "PT-8801",
                        "firstName", "Jane",
                        "lastName", "Doe",
                        "status", "SCREENING_PENDING",
                        "assignedStudy", "EN-CARD-2026",
                        "siteCode", "SITE-001"
                ),
                Map.of(
                        "id", "PT-8802",
                        "firstName", "John",
                        "lastName", "Smith",
                        "status", "ENROLLED",
                        "assignedStudy", "EN-CARD-2026",
                        "siteCode", "SITE-001"
                )
        );
        return ResponseEntity.ok(ApiResponse.success(participants));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Participant Details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getParticipant(@PathVariable String id) {
        Map<String, Object> participant = Map.of(
                "id", id,
                "firstName", "Jane",
                "lastName", "Doe",
                "status", "SCREENING_PENDING",
                "assignedStudy", "EN-CARD-2026",
                "siteCode", "SITE-001"
        );
        return ResponseEntity.ok(ApiResponse.success(participant));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Participant Service Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-participant-service",
                "status", "OPERATIONAL",
                "capabilities", "Demographics, Master Index, Intake Workflow"
        )));
    }
}
