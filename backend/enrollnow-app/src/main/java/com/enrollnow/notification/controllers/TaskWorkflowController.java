package com.enrollnow.notification.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.notification.dto.*;
import com.enrollnow.notification.models.CalendarEventEntity;
import com.enrollnow.notification.models.TaskEntity;
import com.enrollnow.notification.services.TaskWorkflowService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class TaskWorkflowController {

    private final TaskWorkflowService taskWorkflowService;
    private final SiteAuthorizationService siteAuthorizationService;

    @Autowired
    public TaskWorkflowController(
            TaskWorkflowService taskWorkflowService,
            @Autowired(required = false) SiteAuthorizationService siteAuthorizationService) {
        this.taskWorkflowService = taskWorkflowService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    private UUID resolveTenantId(UUID pathTenantId) {
        if (siteAuthorizationService != null) {
            if (pathTenantId != null) {
                siteAuthorizationService.requireTenantMatch(pathTenantId);
                return pathTenantId;
            }
            return siteAuthorizationService.getAuthenticatedCaller()
                    .map(SiteAuthorizationService.CallerIdentity::tenantId)
                    .orElse(pathTenantId);
        }
        return pathTenantId;
    }

    private UUID resolveCallerUserId() {
        if (siteAuthorizationService != null) {
            return siteAuthorizationService.getAuthenticatedCaller()
                    .map(SiteAuthorizationService.CallerIdentity::userId)
                    .orElse(null);
        }
        return null;
    }

    // --- Task Creation ---

    @PostMapping({"/tenants/{tenantId}/tasks", "/tasks"})
    public ResponseEntity<TaskEntity> createTask(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @Valid @RequestBody CreateTaskRequest request) {
        UUID effectiveTenantId = resolveTenantId(tenantId != null ? tenantId : headerTenantId);
        UUID callerUserId = resolveCallerUserId();

        TaskEntity created = taskWorkflowService.createTask(
                effectiveTenantId,
                request.getStudyId(),
                request.getParticipantId(),
                request.getTitle(),
                request.getDescription(),
                request.getType(),
                request.getDueAt(),
                request.getAssignedUserIds(),
                callerUserId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // --- Task Assignment ---

    @PostMapping({"/tenants/{tenantId}/tasks/{taskId}/assignments", "/tasks/{taskId}/assignments"})
    public ResponseEntity<TaskEntity> assignTask(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @PathVariable UUID taskId,
            @RequestBody(required = false) AssignTaskRequest request) {
        UUID effectiveTenantId = resolveTenantId(tenantId != null ? tenantId : headerTenantId);
        UUID callerUserId = resolveCallerUserId();

        TaskEntity assigned = taskWorkflowService.assignTask(
                effectiveTenantId,
                taskId,
                request != null ? request.getAssignedUserIds() : null,
                callerUserId
        );
        return ResponseEntity.ok(assigned);
    }

    // --- Task Comments ---

    @PostMapping({"/tenants/{tenantId}/tasks/{taskId}/comments", "/tasks/{taskId}/comments"})
    public ResponseEntity<Map<String, Object>> addTaskComment(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskCommentRequest request) {
        UUID effectiveTenantId = resolveTenantId(tenantId != null ? tenantId : headerTenantId);
        UUID callerUserId = resolveCallerUserId();

        taskWorkflowService.addTaskComment(effectiveTenantId, taskId, request.getComment(), callerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "taskId", taskId));
    }

    // --- Task Status Changes ---

    @PatchMapping({"/tenants/{tenantId}/tasks/{taskId}/status", "/tasks/{taskId}/status"})
    public ResponseEntity<Map<String, Object>> updateTaskStatus(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        UUID effectiveTenantId = resolveTenantId(tenantId != null ? tenantId : headerTenantId);
        UUID callerUserId = resolveCallerUserId();

        taskWorkflowService.updateTaskStatus(effectiveTenantId, taskId, request.getStatus(), callerUserId);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "taskId", taskId, "newStatus", request.getStatus()));
    }

    // --- Task Due Date Changes ---

    @PatchMapping({"/tenants/{tenantId}/tasks/{taskId}/due-date", "/tasks/{taskId}/due-date"})
    public ResponseEntity<Map<String, Object>> updateTaskDueDate(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @PathVariable UUID taskId,
            @RequestBody(required = false) UpdateTaskDueDateRequest request) {
        UUID effectiveTenantId = resolveTenantId(tenantId != null ? tenantId : headerTenantId);
        UUID callerUserId = resolveCallerUserId();

        taskWorkflowService.updateTaskDueDate(effectiveTenantId, taskId, request != null ? request.getDueAt() : null, callerUserId);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "taskId", taskId));
    }

    // --- Calendar Event Status Changes ---

    @PatchMapping({"/tenants/{tenantId}/calendar-events/{eventId}/status", "/calendar-events/{eventId}/status"})
    public ResponseEntity<Map<String, Object>> updateCalendarEventStatus(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @PathVariable UUID eventId,
            @Valid @RequestBody UpdateCalendarEventStatusRequest request) {
        UUID effectiveTenantId = resolveTenantId(tenantId != null ? tenantId : headerTenantId);
        UUID callerUserId = resolveCallerUserId();

        taskWorkflowService.updateCalendarEventStatus(effectiveTenantId, eventId, request.getStatus(), callerUserId);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "eventId", eventId, "newStatus", request.getStatus()));
    }

    // --- Get Task Details ---

    @GetMapping({"/tenants/{tenantId}/tasks/{taskId}", "/tasks/{taskId}"})
    public ResponseEntity<TaskEntity> getTask(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @PathVariable UUID taskId) {
        UUID effectiveTenantId = resolveTenantId(tenantId != null ? tenantId : headerTenantId);
        TaskEntity task = taskWorkflowService.getTask(effectiveTenantId, taskId);
        return ResponseEntity.ok(task);
    }
}
