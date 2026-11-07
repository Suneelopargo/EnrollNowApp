package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxEventClaimServiceTest {

    @Mock
    private OutboxEventEntityRepository outboxRepository;

    private OutboxEventClaimService claimService;

    @BeforeEach
    void setUp() {
        claimService = new OutboxEventClaimService(outboxRepository);
    }

    @Test
    void testClaimBatch_MarksProcessingWithWorkerId() {
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(UUID.randomUUID());
        event.setStatus("PENDING");

        when(outboxRepository.claimPendingEventsForUpdate(any(), eq(5), eq(10)))
                .thenReturn(List.of(event));

        List<UUID> claimed = claimService.claimBatch(Instant.now(), 5, 10, "worker-123");

        assertEquals(1, claimed.size());
        assertEquals(event.getId(), claimed.get(0));
        assertEquals("PROCESSING", event.getStatus());
        assertEquals("worker-123", event.getLockedBy());
        assertNotNull(event.getLockedAt());
        verify(outboxRepository, times(1)).flush();
    }

    @Test
    void testRecoverStaleLeases_ResetsStaleProcessingEvents() {
        OutboxEventEntity stale = new OutboxEventEntity();
        stale.setId(UUID.randomUUID());
        stale.setStatus("PROCESSING");
        stale.setLockedAt(Instant.now().minusSeconds(400));
        stale.setLockedBy("crashed-worker");
        stale.setRetryCount(1);

        when(outboxRepository.findStaleProcessingEvents(any(), eq(50)))
                .thenReturn(List.of(stale));

        claimService.recoverStaleLeases(Duration.ofMinutes(5), 50, 5);

        assertEquals("FAILED", stale.getStatus());
        assertEquals(2, stale.getRetryCount());
        assertNull(stale.getLockedAt());
        assertNull(stale.getLockedBy());
        assertTrue(stale.getLastError().contains("Lease expired"));
        verify(outboxRepository, times(1)).flush();
    }

    @Test
    void testExtendLease_ProlongsActiveWorkerLease() {
        UUID eventId = UUID.randomUUID();
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setStatus("PROCESSING");
        event.setLockedBy("worker-123");
        event.setLockedAt(Instant.now().minusSeconds(60));

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));

        boolean extended = claimService.extendLease(eventId, "worker-123");

        assertTrue(extended);
        verify(outboxRepository, times(1)).saveAndFlush(event);
    }
}
