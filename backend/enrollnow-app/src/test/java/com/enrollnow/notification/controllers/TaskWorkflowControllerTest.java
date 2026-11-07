package com.enrollnow.notification.controllers;

import com.enrollnow.common.events.OutboxEventPublisher;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.notification.dto.*;
import com.enrollnow.notification.models.CalendarEventEntity;
import com.enrollnow.notification.models.TaskAssignmentEntity;
import com.enrollnow.notification.models.TaskEntity;
import com.enrollnow.notification.repositories.CalendarEventEntityRepository;
import com.enrollnow.notification.repositories.TaskAssignmentEntityRepository;
import com.enrollnow.notification.repositories.TaskEntityRepository;
import com.enrollnow.notification.services.TaskWorkflowService;
import com.enrollnow.notification.templates.NotificationTemplateCatalog;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskWorkflowControllerTest {

    @Mock
    private TaskEntityRepository taskRepository;

    @Mock
    private TaskAssignmentEntityRepository assignmentRepository;

    @Mock
    private CalendarEventEntityRepository calendarEventRepository;

    @Mock
    private OutboxEventPublisher outboxPublisher;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private StudyRepository studyRepository;

    private TaskWorkflowService taskWorkflowService;
    private TaskWorkflowController controller;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID callerUserId = UUID.randomUUID();
    private final UUID taskId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final UUID participantId = UUID.randomUUID();
    private final UUID eventId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        taskWorkflowService = new TaskWorkflowService(
                taskRepository,
                assignmentRepository,
                calendarEventRepository,
                outboxPublisher
        );
        controller = new TaskWorkflowController(
                taskWorkflowService,
                siteAuthorizationService,
                studyMemberRepository,
                studyRepository
        );

        lenient().when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(callerUserId, tenantId)));

        Study mockStudy = new Study();
        mockStudy.setId(studyId);
        mockStudy.setTenantId(tenantId);
        lenient().when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(mockStudy));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, callerUserId));
        member.setTenantId(tenantId);
        member.setActive(true);
        lenient().when(studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, callerUserId))
                .thenReturn(Optional.of(member));
    }

    // --- Task Creation (Frontend Integration & Authorization) ---

    @Test
    void testCreateTask_PersistsTaskAndPublishesOutboxEvent() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setStudyId(studyId);
        request.setParticipantId(participantId);
        request.setTitle("Initial Assessment Task");
        request.setDescription("Complete baseline screening");
        request.setType("screening");
        request.setDueAt(Instant.now().plusSeconds(86400));
        UUID assignedUser = UUID.randomUUID();
        request.setAssignedUserIds(List.of(assignedUser));

        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(inv -> {
            TaskEntity t = inv.getArgument(0);
            t.setId(taskId);
            return t;
        });

        ResponseEntity<Map<String, Object>> response = controller.createTask(tenantId, request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        TaskResponseDto data = (TaskResponseDto) response.getBody().get("data");
        assertNotNull(data);
        assertEquals("Initial Assessment Task", data.getTitle());
        assertEquals("screening", data.getCategory());

        verify(taskRepository).save(any(TaskEntity.class));
        verify(assignmentRepository).save(any(TaskAssignmentEntity.class));

        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(outboxPublisher).publish(
                eq(tenantId),
                eq("TASK"),
                eq(taskId),
                eq(NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED),
                payloadCaptor.capture(),
                eq(callerUserId),
                eq("TASK:" + taskId + ":CREATED")
        );

        Map<String, Object> payload = payloadCaptor.getValue();
        assertEquals(studyId.toString(), payload.get("studyId"));
        assertEquals("Initial Assessment Task", payload.get("taskTitle"));
        assertTrue(((List<?>) payload.get("assignedUserIds")).contains(assignedUser.toString()));
    }

    // --- Task Assignment ---

    @Test
    void testAssignTask_SavesAssignmentsAndPublishesOutboxEvent() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setStudyId(studyId);
        existingTask.setTitle("Follow-up Call");
        existingTask.setStatus("OPEN");

        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(assignmentRepository.findUserIdsAssignedToTask(tenantId, taskId)).thenReturn(Collections.emptyList());

        UUID newUser1 = UUID.randomUUID();
        UUID newUser2 = UUID.randomUUID();
        AssignTaskRequest request = new AssignTaskRequest(List.of(newUser1, newUser2));

        ResponseEntity<Map<String, Object>> response = controller.assignTask(tenantId, taskId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        TaskResponseDto data = (TaskResponseDto) response.getBody().get("data");
        assertEquals("Assigned", data.getStatus());

        verify(assignmentRepository, times(2)).save(any(TaskAssignmentEntity.class));
        verify(outboxPublisher).publish(
                eq(tenantId),
                eq("TASK"),
                eq(taskId),
                eq(NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED),
                any(),
                eq(callerUserId)
        );
    }

    // --- Task Comments ---

    @Test
    void testAddTaskComment_PublishesCommentOutboxEvent() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setStudyId(studyId);
        existingTask.setTitle("Lab Work Review");

        UUID assignedUser = UUID.randomUUID();
        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));
        when(assignmentRepository.findUserIdsAssignedToTask(tenantId, taskId)).thenReturn(List.of(assignedUser));

        TaskCommentRequest request = new TaskCommentRequest("Lab report received from central laboratory");
        ResponseEntity<Map<String, Object>> response = controller.addTaskComment(tenantId, taskId, request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(outboxPublisher).publish(
                eq(tenantId),
                eq("TASK"),
                eq(taskId),
                eq(NotificationTemplateCatalog.EVENT_TYPE_TASK_COMMENT_ADDED),
                payloadCaptor.capture(),
                eq(callerUserId)
        );

        Map<String, Object> payload = payloadCaptor.getValue();
        assertEquals("Lab report received from central laboratory", payload.get("comment"));
        assertEquals("Lab Work Review", payload.get("taskTitle"));
        assertTrue(((List<?>) payload.get("assignedUserIds")).contains(assignedUser.toString()));
    }

    // --- Task Status Changes ---

    @Test
    void testUpdateTaskStatus_UpdatesStatusAndPublishesOutboxEvent() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setStudyId(studyId);
        existingTask.setTitle("Consent Verification");
        existingTask.setStatus("Assigned");

        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest("COMPLETED");
        ResponseEntity<Map<String, Object>> response = controller.updateTaskStatus(tenantId, taskId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("COMPLETED", existingTask.getStatus());

        verify(outboxPublisher).publish(
                eq(tenantId),
                eq("TASK"),
                eq(taskId),
                eq(NotificationTemplateCatalog.EVENT_TYPE_TASK_STATUS_CHANGED),
                any(),
                eq(callerUserId)
        );
    }

    // --- Task Due Date Changes ---

    @Test
    void testUpdateTaskDueDate_UpdatesDueDateAndPublishesOutboxEvent() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setStudyId(studyId);
        existingTask.setTitle("Medication Reconciliation");

        Instant newDue = Instant.now().plusSeconds(172800);
        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaskDueDateRequest request = new UpdateTaskDueDateRequest(newDue);
        ResponseEntity<Map<String, Object>> response = controller.updateTaskDueDate(tenantId, taskId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(newDue, existingTask.getDueAt());

        verify(outboxPublisher).publish(
                eq(tenantId),
                eq("TASK"),
                eq(taskId),
                eq(NotificationTemplateCatalog.EVENT_TYPE_TASK_DUE_DATE_CHANGED),
                any(),
                eq(callerUserId)
        );
    }

    // --- Calendar Event Status Changes ---

    @Test
    void testUpdateCalendarEventStatus_UpdatesEventAndPublishesOutboxEvent() {
        CalendarEventEntity event = new CalendarEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStudyId(studyId);
        event.setTitle("Baseline Clinical Visit");
        event.setStatus("SCHEDULED");

        when(calendarEventRepository.findByTenantIdAndId(tenantId, eventId)).thenReturn(Optional.of(event));
        when(calendarEventRepository.save(any(CalendarEventEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateCalendarEventStatusRequest request = new UpdateCalendarEventStatusRequest("COMPLETED");
        ResponseEntity<Map<String, Object>> response = controller.updateCalendarEventStatus(tenantId, eventId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("COMPLETED", event.getStatus());

        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(outboxPublisher).publish(
                eq(tenantId),
                eq("CALENDAR_EVENT"),
                eq(eventId),
                eq(NotificationTemplateCatalog.EVENT_TYPE_EVENT_STATUS_CHANGED),
                payloadCaptor.capture(),
                eq(callerUserId)
        );

        Map<String, Object> payload = payloadCaptor.getValue();
        assertEquals("Baseline Clinical Visit", payload.get("eventName"));
        assertEquals("COMPLETED", payload.get("eventStatus"));
    }

    // --- Task Details ---

    @Test
    void testGetTask_ReturnsTaskResponseDto() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setStudyId(studyId);
        existingTask.setTitle("ECG Monitoring");
        existingTask.setTaskType("Protocol Action");

        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));

        ResponseEntity<Map<String, Object>> response = controller.getTask(tenantId, taskId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        TaskResponseDto data = (TaskResponseDto) response.getBody().get("data");
        assertEquals("ECG Monitoring", data.getTitle());
        assertEquals(taskId, data.getTaskId());
        assertEquals("Protocol Action", data.getCategory());
    }

    // --- Task Collection GET Endpoint (Test 8) ---

    @Test
    void testGetTasks_CollectionEndpointReturnsTenantTasks() {
        TaskEntity task1 = new TaskEntity();
        task1.setId(UUID.randomUUID());
        task1.setTenantId(tenantId);
        task1.setTitle("Task 1");

        TaskEntity task2 = new TaskEntity();
        task2.setId(UUID.randomUUID());
        task2.setTenantId(tenantId);
        task2.setTitle("Task 2");

        when(taskRepository.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(task1, task2));

        ResponseEntity<Map<String, Object>> response = controller.getTasks(tenantId, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<?> tasks = (List<?>) response.getBody().get("data");
        assertEquals(2, tasks.size());
    }

    @Test
    void testGetTasks_CollectionEndpointWithStudyFilter() {
        TaskEntity studyTask = new TaskEntity();
        studyTask.setId(UUID.randomUUID());
        studyTask.setTenantId(tenantId);
        studyTask.setStudyId(studyId);
        studyTask.setTitle("Study Specific Task");

        when(taskRepository.findByTenantIdAndStudyIdAndActiveTrue(tenantId, studyId)).thenReturn(List.of(studyTask));

        ResponseEntity<Map<String, Object>> response = controller.getTasks(tenantId, studyId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<?> tasks = (List<?>) response.getBody().get("data");
        assertEquals(1, tasks.size());
    }

    // --- Cross-Tenant Task Access Rejection (Test 9) ---

    @Test
    void testCrossTenantTaskAccess_RejectsWithAccessDeniedException() {
        UUID otherTenantId = UUID.randomUUID();
        doThrow(new AccessDeniedException("Access denied: cross-tenant operation is not permitted"))
                .when(siteAuthorizationService).requireTenantMatch(otherTenantId);

        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Cross tenant attempt");

        assertThrows(AccessDeniedException.class, () -> controller.createTask(otherTenantId, request));
    }

    // --- Cross-Study Task Access Rejection (Test 10) ---

    @Test
    void testCrossStudyTaskAccess_RejectsWhenCallerHasNoMembership() {
        UUID unauthorizedStudyId = UUID.randomUUID();
        Study study = new Study();
        study.setId(unauthorizedStudyId);
        study.setTenantId(tenantId);
        when(studyRepository.findByTenantIdAndId(tenantId, unauthorizedStudyId)).thenReturn(Optional.of(study));
        when(siteAuthorizationService.canAccessSiteAdmin(tenantId, null)).thenReturn(false);
        when(studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, unauthorizedStudyId, callerUserId))
                .thenReturn(Optional.empty()); // Not a member

        CreateTaskRequest request = new CreateTaskRequest();
        request.setStudyId(unauthorizedStudyId);
        request.setTitle("Unauthorized Study Task");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> controller.createTask(tenantId, request));
        assertTrue(ex.getMessage().contains("authorized membership"));
    }

    @Test
    void testCrossStudyTaskAccess_RejectsWhenStudyBelongsToAnotherTenant() {
        UUID foreignStudyId = UUID.randomUUID();
        when(studyRepository.findByTenantIdAndId(tenantId, foreignStudyId)).thenReturn(Optional.empty());

        CreateTaskRequest request = new CreateTaskRequest();
        request.setStudyId(foreignStudyId);
        request.setTitle("Foreign Study Task");

        assertThrows(AccessDeniedException.class, () -> controller.createTask(tenantId, request));
    }

    // --- Missing Authentication Rejection ---

    @Test
    void testMissingAuthentication_RejectsWithInsufficientAuthenticationException() {
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.empty());

        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Unauthenticated Task");

        assertThrows(InsufficientAuthenticationException.class, () -> controller.createTask(tenantId, request));
    }
}
