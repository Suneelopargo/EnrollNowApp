package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventAttemptEntity;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

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
    private OutboxEventProcessor outboxEventProcessor;
    private OutboxEventClaimService outboxEventClaimService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID tenantId = UUID.randomUUID();
    private final UUID aggregateId = UUID.randomUUID();
    private final UUID actorUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        outboxEventClaimService = new OutboxEventClaimService(outboxRepository);
        outboxEventProcessor = new OutboxEventProcessor(
                outboxRepository,
                attemptRepository,
                notificationDispatcher,
                outboxEventClaimService
        );
        outboxService = new NotificationOutboxService(
                outboxRepository,
                attemptRepository,
                notificationDispatcher,
                objectMapper,
                outboxEventProcessor,
                outboxEventClaimService
        );
        lenient().when(outboxRepository.isLeaseValid(any(), any())).thenReturn(true);
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
    void testPublishEvent_IdempotencyKey_AvoidsDuplicate() {
        String key = "TASK:" + aggregateId + ":CREATED";
        OutboxEventEntity existing = new OutboxEventEntity();
        existing.setId(UUID.randomUUID());
        existing.setIdempotencyKey(key);
        when(outboxRepository.findByTenantIdAndIdempotencyKey(tenantId, key)).thenReturn(Optional.of(existing));

        Map<String, Object> payload = Map.of("title", "Duplicate Test");
        OutboxEventEntity result = outboxService.publishEvent(
                tenantId,
                "TASK",
                aggregateId,
                "TASK_CREATED",
                payload,
                actorUserId,
                key
        );

        assertSame(existing, result);
        verify(outboxRepository, never()).save(any(OutboxEventEntity.class));
    }

    @Test
    void testProcessSingleEvent_Success_MarksPublished() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy(outboxService.getInstanceId());
        event.setRetryCount(0);
        event.setEventType("TASK_CREATED");
        event.setPayload("{\"title\":\"Test Task\"}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));

        outboxService.processSingleEvent(eventId);

        verify(notificationDispatcher, times(1)).dispatch(event);
        assertEquals("PUBLISHED", event.getStatus());
        assertNotNull(event.getPublishedAt());
        assertNull(event.getLockedBy());
        verify(attemptRepository, atLeastOnce()).saveAndFlush(any());
        verify(outboxRepository, atLeastOnce()).saveAndFlush(event);
    }

    @Test
    void testProcessSingleEvent_LeaseOwnershipValidation_AbortsIfWorkerMismatch() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy("different-worker-node");
        event.setRetryCount(0);
        event.setEventType("TASK_CREATED");
        event.setPayload("{\"title\":\"Test Task\"}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));

        outboxService.processSingleEvent(eventId);

        // Should abort immediately without dispatching
        verify(notificationDispatcher, never()).dispatch(any());
        assertEquals("PROCESSING", event.getStatus());
        assertEquals("different-worker-node", event.getLockedBy());
    }

    @Test
    void testProcessSingleEvent_Failure_ExponentialBackoff() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy(outboxService.getInstanceId());
        event.setRetryCount(0);
        event.setEventType("TASK_CREATED");
        event.setPayload("{\"title\":\"Test Task\"}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));
        doThrow(new RuntimeException("SMTP connection refused")).when(notificationDispatcher).dispatch(event);

        outboxService.processSingleEvent(eventId);

        assertEquals("FAILED", event.getStatus());
        assertEquals(1, event.getRetryCount());
        assertEquals("SMTP connection refused", event.getLastError());
        assertNull(event.getLockedBy());
        assertNotNull(event.getAvailableAt());
        verify(attemptRepository, atLeastOnce()).saveAndFlush(any());
    }

    @Test
    void testProcessSingleEvent_NonRetryableException_ImmediateDeadLetter() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy(outboxService.getInstanceId());
        event.setRetryCount(0);
        event.setEventType("UNKNOWN_EVENT_TYPE");
        event.setPayload("{}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));
        doThrow(new IllegalArgumentException("Unsupported notification outbox event type: UNKNOWN_EVENT_TYPE"))
                .when(notificationDispatcher).dispatch(event);

        outboxService.processSingleEvent(eventId);

        assertEquals("DEAD_LETTER", event.getStatus());
        assertEquals(1, event.getRetryCount());
        assertTrue(event.getLastError().contains("Unsupported notification outbox event type"));
    }

    @Test
    void testProcessSingleEvent_MaxRetries_DeadLetter() throws Exception {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy(outboxService.getInstanceId());
        event.setRetryCount(4);
        event.setEventType("TASK_CREATED");
        event.setPayload("{\"title\":\"Test Task\"}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));
        doThrow(new RuntimeException("Permanent error")).when(notificationDispatcher).dispatch(event);

        outboxService.processSingleEvent(eventId);

        assertEquals("DEAD_LETTER", event.getStatus());
        assertEquals(5, event.getRetryCount());
    }

    @Test
    void testClaimBatch_UpdatesStatusToProcessing() {
        OutboxEventEntity e1 = new OutboxEventEntity();
        e1.setId(UUID.randomUUID());
        e1.setStatus("PENDING");

        OutboxEventEntity e2 = new OutboxEventEntity();
        e2.setId(UUID.randomUUID());
        e2.setStatus("PENDING");

        when(outboxRepository.claimPendingEventsForUpdate(any(), eq(5), eq(50)))
                .thenReturn(List.of(e1, e2));

        List<UUID> claimed = outboxService.claimBatch(Instant.now(), 5, 50);

        assertEquals(2, claimed.size());
        assertEquals("PROCESSING", e1.getStatus());
        assertNotNull(e1.getLockedAt());
        assertNotNull(e1.getLockedBy());
        verify(outboxRepository, times(1)).flush();
    }

    @Test
    void testRecoverStaleLeases_ResetsStuckEvents() {
        OutboxEventEntity stuck = new OutboxEventEntity();
        stuck.setId(UUID.randomUUID());
        stuck.setStatus("PROCESSING");
        stuck.setLockedAt(Instant.now().minusSeconds(600));
        stuck.setRetryCount(1);

        when(outboxRepository.findStaleProcessingEvents(any(), eq(50)))
                .thenReturn(List.of(stuck));

        outboxService.recoverStaleLeases();

        assertEquals("FAILED", stuck.getStatus());
        assertEquals(2, stuck.getRetryCount());
        assertNull(stuck.getLockedAt());
        assertTrue(stuck.getLastError().contains("Lease expired"));
        verify(outboxRepository, times(1)).flush();
    }
}
