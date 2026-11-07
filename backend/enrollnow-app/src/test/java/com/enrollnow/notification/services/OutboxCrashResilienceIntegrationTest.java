package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventAttemptEntity;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.models.OutboxEventRecipientEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventRecipientEntityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxCrashResilienceIntegrationTest {

    @Mock
    private OutboxEventEntityRepository outboxRepository;

    @Mock
    private OutboxEventAttemptEntityRepository attemptRepository;

    @Mock
    private OutboxEventRecipientEntityRepository recipientRepository;

    @Mock
    private NotificationDispatcher notificationDispatcher;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private OutboxEventClaimService claimService;
    private OutboxRecipientDeliveryTracker deliveryTracker;
    private OutboxEventProcessor processor;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID eventId = UUID.randomUUID();
    private final String workerId = "worker-" + UUID.randomUUID();

    @BeforeEach
    void setUp() {
        claimService = new OutboxEventClaimService(outboxRepository);
        deliveryTracker = new OutboxRecipientDeliveryTracker(recipientRepository, jdbcTemplate);
        processor = new OutboxEventProcessor(
                outboxRepository,
                attemptRepository,
                notificationDispatcher,
                claimService
        );
    }

    @Test
    void testRecipientDeliveryTracker_RecordSuccessAndCheckDelivered() {
        String recipient = "investigator@hospital.org";
        OutboxEventRecipientEntity entity = new OutboxEventRecipientEntity();
        entity.setTenantId(tenantId);
        entity.setOutboxEventId(eventId);
        entity.setRecipientEmail(recipient);
        entity.setStatus("SENT");
        entity.setDeliveredAt(Instant.now());

        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, recipient))
                .thenReturn(Optional.of(entity));

        boolean isDelivered = deliveryTracker.isRecipientDelivered(tenantId, eventId, recipient);
        assertTrue(isDelivered);

        when(recipientRepository.saveAndFlush(any(OutboxEventRecipientEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        deliveryTracker.recordDeliverySuccess(tenantId, eventId, recipient);
        verify(recipientRepository).saveAndFlush(any(OutboxEventRecipientEntity.class));
    }

    @Test
    void testRecipientDeliveryTracker_HandlesDuplicateGracefully() {
        String recipient = "coordinator@site.edu";
        when(recipientRepository.saveAndFlush(any(OutboxEventRecipientEntity.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        // Must not throw exception
        assertDoesNotThrow(() -> deliveryTracker.recordDeliverySuccess(tenantId, eventId, recipient));
    }

    @Test
    void testRenewLease_AtomicQueryUpdatesDatabaseLease() {
        when(outboxRepository.renewLease(eq(eventId), eq(workerId), any(Instant.class)))
                .thenReturn(1);

        boolean renewed = claimService.extendLease(eventId, workerId);
        assertTrue(renewed);
        verify(outboxRepository).renewLease(eq(eventId), eq(workerId), any(Instant.class));
    }

    @Test
    void testIsLeaseValid_ConfirmsOwnership() {
        when(outboxRepository.isLeaseValid(eq(eventId), eq(workerId))).thenReturn(true);
        assertTrue(claimService.isLeaseValid(eventId, workerId));

        when(outboxRepository.isLeaseValid(eq(eventId), eq("stolen-worker"))).thenReturn(false);
        assertFalse(claimService.isLeaseValid(eventId, "stolen-worker"));
    }

    @Test
    void testProcessor_AbortsWhenLeaseIsLostBeforeDispatch() {
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy("stolen-by-other-node");
        event.setLockedAt(Instant.now());
        event.setPayload("{}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));

        // Lease is invalid because worker ownership does not match
        processor.processSingleEvent(eventId, workerId);

        // Verify dispatcher was never invoked because lease validation failed
        verifyNoInteractions(notificationDispatcher);
        // Verify attempt was not recorded as success
        verify(outboxRepository, never()).save(argThat(e -> "PUBLISHED".equals(e.getStatus())));
    }

    @Test
    void testProcessor_DispatchesAndMarksPublishedWhenLeaseValid() throws Exception {
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy(workerId);
        event.setLockedAt(Instant.now());
        event.setPayload("{}");
        event.setEventType("TASK_CREATED");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(outboxRepository.isLeaseValid(eventId, workerId)).thenReturn(true);

        processor.processSingleEvent(eventId, workerId);

        verify(notificationDispatcher).dispatch(event);
        assertEquals("PUBLISHED", event.getStatus());
        assertNotNull(event.getPublishedAt());
        assertNull(event.getLockedAt());
        assertNull(event.getLockedBy());
        verify(attemptRepository).saveAndFlush(any(OutboxEventAttemptEntity.class));
    }
}
