package com.enrollnow.task.controllers;

import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tasks & Operations", description = "Endpoints for screening follow-ups, coordinator task queues, and protocol milestones")
@SecurityRequirement(name = "BearerAuth")
public class TaskController {

    @GetMapping
    @Operation(summary = "List Tasks", description = "Retrieves active operational tasks.")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTasks() {
        List<Map<String, Object>> tasks = List.of(
                Map.of(
                        "id", "TSK-301",
                        "title", "Review prescreening lab results for candidate EN-8842",
                        "studyId", "ST-101",
                        "priority", "HIGH",
                        "status", "PENDING",
                        "dueDate", "2026-09-25T17:00:00Z"
                ),
                Map.of(
                        "id", "TSK-302",
                        "title", "Schedule follow-up phone call with candidate EN-8845",
                        "studyId", "ST-101",
                        "priority", "MEDIUM",
                        "status", "PENDING",
                        "dueDate", "2026-09-26T12:00:00Z"
                )
        );
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Task Service Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-task-service",
                "status", "OPERATIONAL",
                "capabilities", "Coordinator Queues, Milestones, Action Alerts"
        )));
    }
}
