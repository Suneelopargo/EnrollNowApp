package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationOutboxServiceTest {

    @Mock
    private OutboxEventEntityRepository outboxRepository;
    @Mock
    private OutboxEventAttemptEntityRepository attemptRepository;
    @Mock
    private NotificationDispatcher notificationDispatcher;

    private NotificationOutboxService outboxService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID tenantId = UUID.randomUUID();
    private final UUID aggregateId = UUID.randomUUID();
    private final UUID actorUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        outboxService = new NotificationOutboxService(
                outboxRepository,
                attemptRepository,
                notificationDispatcher,
                objectMapper
        );
    }

    @Test
    void testPublishEvent_PersistsPendingEvent() {
        when(outboxRepository.save(any(OutboxEventEntity.class))).thenAnswer(inv -> {
            OutboxEventEntity e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        Map<String, Object> payload = Map.of("taskId", aggregateId.toString(), "title", "Test Task");
        OutboxEventEntity result = outboxService.publishEvent(
                tenantId,
                "TASK",
                aggregateId,
                "TASK_CREATED",
                payload,
                actorUserId
        );

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals("PENDING", result.getStatus());
        assertEquals(tenantId, result.getTenantId());
        assertEquals("TASK_CREATED", result.getEventType());
        verify(outboxRepository, times(1)).save(any(OutboxEventEntity.class));
    }

    @Test
    void testProcessSingleEvent_Success_MarksPublished() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PENDING");
        event.setRetryCount(0);
        event.setEventType("TASK_CREATED");
        event.setPayload("{\"title\":\"Test Task\"}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));

        outboxService.processSingleEvent(eventId);

        verify(notificationDispatcher, times(1)).dispatch(event);
        assertEquals("PUBLISHED", event.getStatus());
        assertNotNull(event.getPublishedAt());
        verify(attemptRepository, times(1)).save(any());
        verify(outboxRepository, atLeastOnce()).save(event);
    }

    @Test
    void testProcessSingleEvent_Failure_ExponentialBackoff() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PENDING");
        event.setRetryCount(0);
        event.setEventType("TASK_CREATED");
        event.setPayload("{\"title\":\"Test Task\"}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));
        doThrow(new RuntimeException("SMTP connection refused")).when(notificationDispatcher).dispatch(event);

        outboxService.processSingleEvent(eventId);

        assertEquals("FAILED", event.getStatus());
        assertEquals(1, event.getRetryCount());
        assertEquals("SMTP connection refused", event.getLastError());
        assertNotNull(event.getAvailableAt());
        verify(attemptRepository, times(1)).save(any());
    }

    @Test
    void testProcessSingleEvent_MaxRetries_DeadLetter() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("FAILED");
        event.setRetryCount(4);
        event.setEventType("TASK_CREATED");
        event.setPayload("{\"title\":\"Test Task\"}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));
        doThrow(new RuntimeException("Permanent error")).when(notificationDispatcher).dispatch(event);

        outboxService.processSingleEvent(eventId);

        assertEquals("DEAD_LETTER", event.getStatus());
        assertEquals(5, event.getRetryCount());
    }
}
