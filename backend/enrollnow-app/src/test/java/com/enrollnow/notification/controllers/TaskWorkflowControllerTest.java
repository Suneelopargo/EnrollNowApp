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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

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
        controller = new TaskWorkflowController(taskWorkflowService, siteAuthorizationService);

        lenient().when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(callerUserId, tenantId)));
    }

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

        ResponseEntity<TaskEntity> response = controller.createTask(tenantId, null, request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Initial Assessment Task", response.getBody().getTitle());

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

        ResponseEntity<TaskEntity> response = controller.assignTask(tenantId, null, taskId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Assigned", response.getBody().getStatus());

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
        ResponseEntity<Map<String, Object>> response = controller.addTaskComment(tenantId, null, taskId, request);

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

    @Test
    void testUpdateTaskStatus_UpdatesStatusAndPublishesOutboxEvent() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setTitle("Consent Verification");
        existingTask.setStatus("Assigned");

        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest("COMPLETED");
        ResponseEntity<Map<String, Object>> response = controller.updateTaskStatus(tenantId, null, taskId, request);

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

    @Test
    void testUpdateTaskDueDate_UpdatesDueDateAndPublishesOutboxEvent() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setTitle("Medication Reconciliation");

        Instant newDue = Instant.now().plusSeconds(172800);
        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaskDueDateRequest request = new UpdateTaskDueDateRequest(newDue);
        ResponseEntity<Map<String, Object>> response = controller.updateTaskDueDate(tenantId, null, taskId, request);

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
        ResponseEntity<Map<String, Object>> response = controller.updateCalendarEventStatus(tenantId, null, eventId, request);

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

    @Test
    void testGetTask_ReturnsTaskEntity() {
        TaskEntity existingTask = new TaskEntity();
        existingTask.setId(taskId);
        existingTask.setTenantId(tenantId);
        existingTask.setTitle("ECG Monitoring");

        when(taskRepository.findByTenantIdAndId(tenantId, taskId)).thenReturn(Optional.of(existingTask));

        ResponseEntity<TaskEntity> response = controller.getTask(tenantId, null, taskId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ECG Monitoring", response.getBody().getTitle());
    }
}
