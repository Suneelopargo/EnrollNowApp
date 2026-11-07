package com.enrollnow.notification.services;

import com.enrollnow.common.events.OutboxEventPublisher;
import com.enrollnow.notification.models.CalendarEventEntity;
import com.enrollnow.notification.models.TaskAssignmentEntity;
import com.enrollnow.notification.models.TaskEntity;
import com.enrollnow.notification.repositories.CalendarEventEntityRepository;
import com.enrollnow.notification.repositories.TaskAssignmentEntityRepository;
import com.enrollnow.notification.repositories.TaskEntityRepository;
import com.enrollnow.notification.templates.NotificationTemplateCatalog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class TaskWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(TaskWorkflowService.class);

    private final TaskEntityRepository taskRepository;
    private final TaskAssignmentEntityRepository assignmentRepository;
    private final CalendarEventEntityRepository calendarEventRepository;
    private final OutboxEventPublisher outboxPublisher;

    @Autowired
    public TaskWorkflowService(
            TaskEntityRepository taskRepository,
            TaskAssignmentEntityRepository assignmentRepository,
            CalendarEventEntityRepository calendarEventRepository,
            OutboxEventPublisher outboxPublisher) {
        this.taskRepository = taskRepository;
        this.assignmentRepository = assignmentRepository;
        this.calendarEventRepository = calendarEventRepository;
        this.outboxPublisher = outboxPublisher;
    }

    @Transactional
    public TaskEntity createTask(
            UUID tenantId,
            UUID studyId,
            UUID participantId,
            String title,
            String description,
            String type,
            Instant dueAt,
            List<UUID> assignedUserIds,
            UUID actorUserId) {

        TaskEntity task = new TaskEntity();
        task.setTenantId(tenantId);
        task.setStudyId(studyId);
        task.setParticipantId(participantId);
        task.setTitle(title);
        task.setDescription(description);
        task.setTaskType(type != null ? type : "participant");
        task.setStatus("Assigned");
        task.setDueAt(dueAt);
        task.setCreatedBy(actorUserId);
        task.setCreatedByUserId(actorUserId);
        task.setUpdatedBy(actorUserId);
        task.setCreatedAt(Instant.now());
        task.setUpdatedAt(Instant.now());

        TaskEntity savedTask = taskRepository.save(task);

        List<String> assignedUserIdStrings = new ArrayList<>();
        if (assignedUserIds != null) {
            for (UUID userId : assignedUserIds) {
                TaskAssignmentEntity assignment = new TaskAssignmentEntity();
                assignment.setTenantId(tenantId);
                assignment.setTaskId(savedTask.getId());
                assignment.setUserId(userId);
                assignment.setCreatedAt(Instant.now());
                assignmentRepository.save(assignment);
                assignedUserIdStrings.add(userId.toString());
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studyId", studyId != null ? studyId.toString() : null);
        payload.put("participantId", participantId != null ? participantId.toString() : null);
        payload.put("taskTitle", title);
        payload.put("actorUserId", actorUserId != null ? actorUserId.toString() : null);
        payload.put("assignedUserIds", assignedUserIdStrings);
        if (dueAt != null) {
            payload.put("dueDate", dueAt.toString());
        }

        String idempotencyKey = "TASK:" + savedTask.getId() + ":CREATED";
        outboxPublisher.publish(
                tenantId,
                "TASK",
                savedTask.getId(),
                NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED,
                payload,
                actorUserId,
                idempotencyKey
        );

        log.info("Created task {} and published outbox event", savedTask.getId());
        return savedTask;
    }

    @Transactional
    public void addTaskComment(UUID tenantId, UUID taskId, String comment, UUID actorUserId) {
        TaskEntity task = taskRepository.findByTenantIdAndId(tenantId, taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        List<UUID> assignedUserIds = assignmentRepository.findUserIdsAssignedToTask(tenantId, taskId);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studyId", task.getStudyId() != null ? task.getStudyId().toString() : null);
        payload.put("participantId", task.getParticipantId() != null ? task.getParticipantId().toString() : null);
        payload.put("taskTitle", task.getTitle());
        payload.put("comment", comment);
        payload.put("actorUserId", actorUserId != null ? actorUserId.toString() : null);
        payload.put("assignedUserIds", assignedUserIds.stream().map(UUID::toString).toList());

        outboxPublisher.publish(
                tenantId,
                "TASK",
                taskId,
                NotificationTemplateCatalog.EVENT_TYPE_TASK_COMMENT_ADDED,
                payload,
                actorUserId
        );
    }

    @Transactional
    public void updateTaskStatus(UUID tenantId, UUID taskId, String newStatus, UUID actorUserId) {
        TaskEntity task = taskRepository.findByTenantIdAndId(tenantId, taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        task.setStatus(newStatus);
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(actorUserId);
        taskRepository.save(task);

        List<UUID> assignedUserIds = assignmentRepository.findUserIdsAssignedToTask(tenantId, taskId);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studyId", task.getStudyId() != null ? task.getStudyId().toString() : null);
        payload.put("participantId", task.getParticipantId() != null ? task.getParticipantId().toString() : null);
        payload.put("taskTitle", task.getTitle());
        payload.put("newStatus", newStatus);
        payload.put("actorUserId", actorUserId != null ? actorUserId.toString() : null);
        payload.put("assignedUserIds", assignedUserIds.stream().map(UUID::toString).toList());

        outboxPublisher.publish(
                tenantId,
                "TASK",
                taskId,
                NotificationTemplateCatalog.EVENT_TYPE_TASK_STATUS_CHANGED,
                payload,
                actorUserId
        );
    }

    @Transactional
    public void updateTaskDueDate(UUID tenantId, UUID taskId, Instant newDueDate, UUID actorUserId) {
        TaskEntity task = taskRepository.findByTenantIdAndId(tenantId, taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        task.setDueAt(newDueDate);
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(actorUserId);
        taskRepository.save(task);

        List<UUID> assignedUserIds = assignmentRepository.findUserIdsAssignedToTask(tenantId, taskId);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studyId", task.getStudyId() != null ? task.getStudyId().toString() : null);
        payload.put("participantId", task.getParticipantId() != null ? task.getParticipantId().toString() : null);
        payload.put("taskTitle", task.getTitle());
        payload.put("newDueDate", newDueDate != null ? newDueDate.toString() : "None");
        payload.put("actorUserId", actorUserId != null ? actorUserId.toString() : null);
        payload.put("assignedUserIds", assignedUserIds.stream().map(UUID::toString).toList());

        outboxPublisher.publish(
                tenantId,
                "TASK",
                taskId,
                NotificationTemplateCatalog.EVENT_TYPE_TASK_DUE_DATE_CHANGED,
                payload,
                actorUserId
        );
    }

    @Transactional
    public void updateCalendarEventStatus(UUID tenantId, UUID eventId, String newStatus, UUID actorUserId) {
        CalendarEventEntity event = calendarEventRepository.findByTenantIdAndId(tenantId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Calendar event not found: " + eventId));

        event.setStatus(newStatus);
        event.setUpdatedAt(Instant.now());
        calendarEventRepository.save(event);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studyId", event.getStudyId() != null ? event.getStudyId().toString() : null);
        payload.put("participantId", event.getParticipantId() != null ? event.getParticipantId().toString() : null);
        payload.put("eventName", event.getTitle());
        payload.put("eventStatus", newStatus);
        payload.put("actorUserId", actorUserId != null ? actorUserId.toString() : null);

        outboxPublisher.publish(
                tenantId,
                "CALENDAR_EVENT",
                eventId,
                NotificationTemplateCatalog.EVENT_TYPE_EVENT_STATUS_CHANGED,
                payload,
                actorUserId
        );
    }

    @Transactional
    public TaskEntity assignTask(UUID tenantId, UUID taskId, List<UUID> assignedUserIds, UUID actorUserId) {
        TaskEntity task = taskRepository.findByTenantIdAndId(tenantId, taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        List<String> assignedUserIdStrings = new ArrayList<>();
        if (assignedUserIds != null) {
            List<UUID> currentAssigned = assignmentRepository.findUserIdsAssignedToTask(tenantId, taskId);
            for (UUID userId : assignedUserIds) {
                if (!currentAssigned.contains(userId)) {
                    TaskAssignmentEntity assignment = new TaskAssignmentEntity();
                    assignment.setTenantId(tenantId);
                    assignment.setTaskId(task.getId());
                    assignment.setUserId(userId);
                    assignment.setCreatedAt(Instant.now());
                    assignmentRepository.save(assignment);
                }
                assignedUserIdStrings.add(userId.toString());
            }
        }

        task.setStatus("Assigned");
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(actorUserId);
        TaskEntity saved = taskRepository.save(task);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studyId", task.getStudyId() != null ? task.getStudyId().toString() : null);
        payload.put("participantId", task.getParticipantId() != null ? task.getParticipantId().toString() : null);
        payload.put("taskTitle", task.getTitle());
        payload.put("actorUserId", actorUserId != null ? actorUserId.toString() : null);
        payload.put("assignedUserIds", assignedUserIdStrings);
        if (task.getDueAt() != null) {
            payload.put("dueDate", task.getDueAt().toString());
        }

        outboxPublisher.publish(
                tenantId,
                "TASK",
                task.getId(),
                NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED,
                payload,
                actorUserId
        );

        log.info("Assigned task {} to users {} and published outbox event", task.getId(), assignedUserIdStrings);
        return saved;
    }

    @Transactional(readOnly = true)
    public TaskEntity getTask(UUID tenantId, UUID taskId) {
        return taskRepository.findByTenantIdAndId(tenantId, taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
    }

    @Transactional(readOnly = true)
    public List<com.enrollnow.notification.dto.TaskResponseDto> getTasks(UUID tenantId, UUID studyId) {
        List<TaskEntity> tasks = studyId != null
                ? taskRepository.findByTenantIdAndStudyIdAndActiveTrue(tenantId, studyId)
                : taskRepository.findByTenantIdAndActiveTrue(tenantId);
        return tasks.stream().map(this::toResponseDto).toList();
    }

    public com.enrollnow.notification.dto.TaskResponseDto toResponseDto(TaskEntity entity) {
        if (entity == null) {
            return null;
        }
        com.enrollnow.notification.dto.TaskResponseDto dto = new com.enrollnow.notification.dto.TaskResponseDto();
        dto.setId(entity.getId());
        dto.setTaskId(entity.getId());
        dto.setTenantId(entity.getTenantId());
        dto.setStudyId(entity.getStudyId());
        dto.setParticipantId(entity.getParticipantId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setTaskType(entity.getTaskType());
        dto.setCategory(entity.getTaskType());
        dto.setPriority(entity.getPriority());
        dto.setStatus(entity.getStatus());
        dto.setDueAt(entity.getDueAt());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        try {
            List<UUID> assigned = assignmentRepository.findUserIdsAssignedToTask(entity.getTenantId(), entity.getId());
            dto.setAssignedUserIds(assigned);
            if (assigned != null && !assigned.isEmpty()) {
                dto.setAssignee(assigned.get(0).toString());
            }
        } catch (Exception ignored) {
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public CalendarEventEntity getCalendarEvent(UUID tenantId, UUID eventId) {
        return calendarEventRepository.findByTenantIdAndId(tenantId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Calendar event not found: " + eventId));
    }
}
