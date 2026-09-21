package com.enrollnow.communication.controllers;

import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/communications")
@Tag(name = "Communications & Outreach", description = "Endpoints for notifications, messaging templates, and delivery logs")
@SecurityRequirement(name = "BearerAuth")
public class CommunicationController {

    @GetMapping("/templates")
    @Operation(summary = "List Communication Templates")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTemplates() {
        List<Map<String, Object>> templates = List.of(
                Map.of(
                        "id", "TPL-01",
                        "title", "Initial Screening Appointment Confirmation",
                        "channel", "EMAIL_AND_SMS",
                        "status", "ACTIVE"
                ),
                Map.of(
                        "id", "TPL-02",
                        "title", "Study Visit Reminder (24hr Notice)",
                        "channel", "SMS",
                        "status", "ACTIVE"
                )
        );
        return ResponseEntity.ok(ApiResponse.success(templates));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Communication Service Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-communication-service",
                "status", "OPERATIONAL",
                "capabilities", "Templates, Outbound SMS/Email, Notification History"
        )));
    }
}
