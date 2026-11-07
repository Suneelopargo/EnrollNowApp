package com.enrollnow.notification.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.notification.dto.*;
import com.enrollnow.notification.models.CalendarEventEntity;
import com.enrollnow.notification.models.TaskEntity;
import com.enrollnow.notification.services.TaskWorkflowService;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class TaskWorkflowController {

    private final TaskWorkflowService taskWorkflowService;
    private final SiteAuthorizationService siteAuthorizationService;
    private final StudyMemberRepository studyMemberRepository;
    private final StudyRepository studyRepository;

    @Autowired
    public TaskWorkflowController(
            TaskWorkflowService taskWorkflowService,
            SiteAuthorizationService siteAuthorizationService,
            StudyMemberRepository studyMemberRepository,
            StudyRepository studyRepository) {
        this.taskWorkflowService = Objects.requireNonNull(taskWorkflowService, "taskWorkflowService must not be null");
        this.siteAuthorizationService = Objects.requireNonNull(siteAuthorizationService, "siteAuthorizationService must not be null");
        this.studyMemberRepository = Objects.requireNonNull(studyMemberRepository, "studyMemberRepository must not be null");
        this.studyRepository = Objects.requireNonNull(studyRepository, "studyRepository must not be null");
    }

    private SiteAuthorizationService.CallerIdentity requireCallerAndValidateTenant(UUID targetTenantId) {
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to access task operations"));

        if (caller.tenantId() == null) {
            throw new AccessDeniedException("Access denied: authenticated caller has no tenant context");
        }

        if (targetTenantId != null) {
            siteAuthorizationService.requireTenantMatch(targetTenantId);
            if (!caller.tenantId().equals(targetTenantId)) {
                throw new AccessDeniedException("Access denied: cross-tenant operation is not permitted");
            }
        }
        return caller;
    }

    private void validateStudyAccess(UUID tenantId, UUID studyId, UUID userId) {
        if (studyId == null) {
            return;
        }

        // Validate study belongs to caller tenant
        Study study = studyRepository.findByTenantIdAndId(tenantId, studyId)
                .orElseThrow(() -> new AccessDeniedException("Access denied: study not found or cross-tenant study access attempted: " + studyId));

        // Site admins/managers have access across all studies in the tenant
        if (siteAuthorizationService.canAccessSiteAdmin(tenantId, null)) {
            return;
        }

        // Otherwise verify active study membership
        boolean isMember = studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, userId)
                .map(StudyMember::isActive)
                .orElse(false);

        if (!isMember) {
            throw new AccessDeniedException("Access denied: caller does not have authorized membership in study " + studyId);
        }
    }

    // --- Task List ---

    @GetMapping({"/tenants/{tenantId}/tasks", "/tasks"})
    public ResponseEntity<Map<String, Object>> getTasks(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @RequestParam(value = "studyId", required = false) UUID studyId) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        if (studyId != null) {
            validateStudyAccess(caller.tenantId(), studyId, caller.userId());
        }

        List<TaskResponseDto> tasks = taskWorkflowService.getTasks(caller.tenantId(), studyId);
        return ResponseEntity.ok(Map.of("data", tasks));
    }

    // --- Task Details ---

    @GetMapping({"/tenants/{tenantId}/tasks/{taskId}", "/tasks/{taskId}"})
    public ResponseEntity<Map<String, Object>> getTask(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @PathVariable UUID taskId) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        TaskEntity task = taskWorkflowService.getTask(caller.tenantId(), taskId);
        validateStudyAccess(caller.tenantId(), task.getStudyId(), caller.userId());

        TaskResponseDto dto = taskWorkflowService.toResponseDto(task);
        return ResponseEntity.ok(Map.of("data", dto));
    }

    // --- Task Creation ---

    @PostMapping({"/tenants/{tenantId}/tasks", "/tasks"})
    public ResponseEntity<Map<String, Object>> createTask(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @Valid @RequestBody CreateTaskRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        validateStudyAccess(caller.tenantId(), request.getStudyId(), caller.userId());

        TaskEntity created = taskWorkflowService.createTask(
                caller.tenantId(),
                request.getStudyId(),
                request.getParticipantId(),
                request.getTitle(),
                request.getDescription(),
                request.getType(),
                request.getDueAt(),
                request.getAssignedUserIds(),
                caller.userId()
        );
        TaskResponseDto dto = taskWorkflowService.toResponseDto(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", dto));
    }

    // --- Task Assignment ---

    @PostMapping({"/tenants/{tenantId}/tasks/{taskId}/assignments", "/tasks/{taskId}/assignments"})
    public ResponseEntity<Map<String, Object>> assignTask(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @PathVariable UUID taskId,
            @RequestBody(required = false) AssignTaskRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        TaskEntity existing = taskWorkflowService.getTask(caller.tenantId(), taskId);
        validateStudyAccess(caller.tenantId(), existing.getStudyId(), caller.userId());

        TaskEntity assigned = taskWorkflowService.assignTask(
                caller.tenantId(),
                taskId,
                request != null ? request.getAssignedUserIds() : null,
                caller.userId()
        );
        TaskResponseDto dto = taskWorkflowService.toResponseDto(assigned);
        return ResponseEntity.ok(Map.of("data", dto));
    }

    // --- Task Comments ---

    @PostMapping({"/tenants/{tenantId}/tasks/{taskId}/comments", "/tasks/{taskId}/comments"})
    public ResponseEntity<Map<String, Object>> addTaskComment(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskCommentRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        TaskEntity existing = taskWorkflowService.getTask(caller.tenantId(), taskId);
        validateStudyAccess(caller.tenantId(), existing.getStudyId(), caller.userId());

        taskWorkflowService.addTaskComment(caller.tenantId(), taskId, request.getComment(), caller.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "taskId", taskId));
    }

    // --- Task Status Changes ---

    @PatchMapping({"/tenants/{tenantId}/tasks/{taskId}/status", "/tasks/{taskId}/status"})
    public ResponseEntity<Map<String, Object>> updateTaskStatus(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        TaskEntity existing = taskWorkflowService.getTask(caller.tenantId(), taskId);
        validateStudyAccess(caller.tenantId(), existing.getStudyId(), caller.userId());

        taskWorkflowService.updateTaskStatus(caller.tenantId(), taskId, request.getStatus(), caller.userId());
        TaskEntity updated = taskWorkflowService.getTask(caller.tenantId(), taskId);
        TaskResponseDto dto = taskWorkflowService.toResponseDto(updated);
        return ResponseEntity.ok(Map.of("data", dto, "status", "SUCCESS", "taskId", taskId, "newStatus", request.getStatus()));
    }

    // --- Task Due Date Changes ---

    @PatchMapping({"/tenants/{tenantId}/tasks/{taskId}/due-date", "/tasks/{taskId}/due-date"})
    public ResponseEntity<Map<String, Object>> updateTaskDueDate(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @PathVariable UUID taskId,
            @RequestBody(required = false) UpdateTaskDueDateRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        TaskEntity existing = taskWorkflowService.getTask(caller.tenantId(), taskId);
        validateStudyAccess(caller.tenantId(), existing.getStudyId(), caller.userId());

        taskWorkflowService.updateTaskDueDate(caller.tenantId(), taskId, request != null ? request.getDueAt() : null, caller.userId());
        TaskEntity updated = taskWorkflowService.getTask(caller.tenantId(), taskId);
        TaskResponseDto dto = taskWorkflowService.toResponseDto(updated);
        return ResponseEntity.ok(Map.of("data", dto, "status", "SUCCESS", "taskId", taskId));
    }

    // --- Calendar Event Status Changes ---

    @PatchMapping({"/tenants/{tenantId}/calendar-events/{eventId}/status", "/calendar-events/{eventId}/status"})
    public ResponseEntity<Map<String, Object>> updateCalendarEventStatus(
            @PathVariable(value = "tenantId", required = false) UUID tenantId,
            @PathVariable UUID eventId,
            @Valid @RequestBody UpdateCalendarEventStatusRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireCallerAndValidateTenant(tenantId);
        CalendarEventEntity existing = taskWorkflowService.getCalendarEvent(caller.tenantId(), eventId);
        validateStudyAccess(caller.tenantId(), existing.getStudyId(), caller.userId());

        taskWorkflowService.updateCalendarEventStatus(caller.tenantId(), eventId, request.getStatus(), caller.userId());
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "eventId", eventId, "newStatus", request.getStatus()));
    }
}
