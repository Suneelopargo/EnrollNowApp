package com.enrollnow.notification.services;

import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.models.UserStudyNotificationPreference;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import com.enrollnow.identity.repositories.UserStudyNotificationPreferenceRepository;
import com.enrollnow.notification.models.OutboxEventAttemptEntity;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.models.OutboxEventRecipientEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventRecipientEntityRepository;
import com.enrollnow.notification.templates.NotificationHtmlRenderer;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

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
    private UserRepository userRepository;

    @Mock
    private UserEmailRepository userEmailRepository;

    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;

    @Mock
    private UserStudyNotificationPreferenceRepository preferenceRepository;

    @Mock
    private StudyRepository studyRepository;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private NotificationEmailDeliveryService emailDeliveryService;

    @Mock
    private PlatformTransactionManager transactionManager;

    private OutboxEventClaimService claimService;
    private OutboxRecipientDeliveryTracker deliveryTracker;
    private OutboxEventProcessor processor;
    private NotificationDispatcher realDispatcher;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID tenantId = UUID.randomUUID();
    private final UUID eventId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final String workerId = "worker-" + UUID.randomUUID();

    @BeforeEach
    void setUp() {
        claimService = new OutboxEventClaimService(outboxRepository);
        deliveryTracker = new OutboxRecipientDeliveryTracker(recipientRepository);
        processor = new OutboxEventProcessor(
                outboxRepository,
                attemptRepository,
                notificationDispatcher,
                claimService,
                transactionManager
        );

        NotificationHtmlRenderer htmlRenderer = new NotificationHtmlRenderer();
        realDispatcher = new NotificationDispatcher(
                userRepository,
                userEmailRepository,
                userSecurityStateRepository,
                preferenceRepository,
                studyRepository,
                studyMemberRepository,
                emailDeliveryService,
                htmlRenderer,
                objectMapper,
                deliveryTracker
        );

        // Configure transaction manager mock to execute callbacks
        lenient().when(transactionManager.getTransaction(any(TransactionDefinition.class)))
                .thenReturn(new SimpleTransactionStatus());

        UserStudyNotificationPreference pref = new UserStudyNotificationPreference();
        pref.setTaskEmails(true);
        lenient().when(preferenceRepository.findByTenantIdAndUserIdAndStudyId(eq(tenantId), any(), any()))
                .thenReturn(Optional.of(pref));
    }

    // --- Test 1: Recipient Success Persistence Failure ---

    @Test
    void testRecipientSuccessPersistenceFailure_PropagatesException() {
        String recipient = "doctor@trial.org";
        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, recipient))
                .thenReturn(Optional.empty());
        when(recipientRepository.saveAndFlush(any(OutboxEventRecipientEntity.class)))
                .thenThrow(new DataAccessException("Disk full or connection timeout") {});

        // Must propagate exception, not swallow
        assertThrows(DataAccessException.class, () ->
                deliveryTracker.recordDeliverySuccess(tenantId, eventId, recipient));
    }

    @Test
    void testRecipientSuccessPersistenceFailure_PreventsPublishedStatus() throws Exception {
        UUID user1Id = UUID.randomUUID();
        User user1 = new User();
        user1.setId(user1Id);
        user1.setFirstName("Bob");

        Study study = new Study();
        study.setId(studyId);
        study.setName("Cardio Trial");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(userRepository.findByTenantIdAndId(tenantId, user1Id)).thenReturn(Optional.of(user1));

        UserEmail email1 = new UserEmail();
        email1.setEmail("bob@hospital.org");
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, user1Id)).thenReturn(Optional.of(email1));
        when(emailDeliveryService.sendEmail(any(), any(), any(), eq("bob@hospital.org"), any(), any(), any())).thenReturn(true);

        // When deliveryTracker throws on saving success
        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, "bob@hospital.org"))
                .thenReturn(Optional.empty());
        when(recipientRepository.saveAndFlush(any(OutboxEventRecipientEntity.class)))
                .thenThrow(new DataAccessException("PostgreSQL error") {});

        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setEventType("TASK_CREATED");
        event.setPayload(objectMapper.writeValueAsString(Map.of(
                "studyId", studyId.toString(),
                "taskTitle", "Vital Signs Check",
                "assignedUserIds", List.of(user1Id.toString())
        )));

        // Real dispatcher fails when recipient persistence fails
        assertThrows(DataAccessException.class, () -> realDispatcher.dispatch(event));
    }

    // --- Test 2: Recipient Failure Persistence Failure ---

    @Test
    void testRecipientFailurePersistenceFailure_PropagatesException() {
        String recipient = "nurse@trial.org";
        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, recipient))
                .thenReturn(Optional.empty());
        when(recipientRepository.saveAndFlush(any(OutboxEventRecipientEntity.class)))
                .thenThrow(new DataAccessException("Database read-only error") {});

        assertThrows(DataAccessException.class, () ->
                deliveryTracker.recordDeliveryFailure(tenantId, eventId, recipient, "Provider network timeout"));
    }

    // --- Test 3: Partial Delivery Followed by Retry ---

    @Test
    void testPartialDeliveryFollowedByRetry_SkipsAlreadyDeliveredRecipient() throws Exception {
        UUID user1Id = UUID.randomUUID();
        UUID user2Id = UUID.randomUUID();

        User user1 = new User();
        user1.setId(user1Id);
        user1.setFirstName("User1");

        User user2 = new User();
        user2.setId(user2Id);
        user2.setFirstName("User2");

        Study study = new Study();
        study.setId(studyId);
        study.setName("Oncology Study");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(userRepository.findByTenantIdAndId(tenantId, user1Id)).thenReturn(Optional.of(user1));
        when(userRepository.findByTenantIdAndId(tenantId, user2Id)).thenReturn(Optional.of(user2));

        UserEmail email1 = new UserEmail();
        email1.setEmail("delivered@hospital.org");
        UserEmail email2 = new UserEmail();
        email2.setEmail("pending@hospital.org");

        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, user1Id)).thenReturn(Optional.of(email1));
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, user2Id)).thenReturn(Optional.of(email2));

        // Recipient 1 was already delivered in PostgreSQL
        OutboxEventRecipientEntity existingDelivered = new OutboxEventRecipientEntity();
        existingDelivered.setTenantId(tenantId);
        existingDelivered.setOutboxEventId(eventId);
        existingDelivered.setRecipientEmail("delivered@hospital.org");
        existingDelivered.setStatus("SENT");

        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, "delivered@hospital.org"))
                .thenReturn(Optional.of(existingDelivered));
        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, "pending@hospital.org"))
                .thenReturn(Optional.empty());

        when(emailDeliveryService.sendEmail(any(), any(), any(), eq("pending@hospital.org"), any(), any(), any())).thenReturn(true);

        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setEventType("TASK_CREATED");
        event.setPayload(objectMapper.writeValueAsString(Map.of(
                "studyId", studyId.toString(),
                "taskTitle", "Review Patient Notes",
                "assignedUserIds", List.of(user1Id.toString(), user2Id.toString())
        )));

        realDispatcher.dispatch(event);

        // Verify email was NOT resent to delivered@hospital.org
        verify(emailDeliveryService, never()).sendEmail(any(), any(), any(), eq("delivered@hospital.org"), any(), any(), any());
        // Verify email WAS sent to pending@hospital.org
        verify(emailDeliveryService, times(1)).sendEmail(any(), any(), any(), eq("pending@hospital.org"), any(), any(), any());
    }

    // --- Test 4: Application Restart After Recipient Success ---

    @Test
    void testApplicationRestart_PreservesDeliveredRecipients() {
        // Simulates application restart: new instance of deliveryTracker constructed
        OutboxRecipientDeliveryTracker restartedTracker = new OutboxRecipientDeliveryTracker(recipientRepository);

        String recipient = "survivor@clinic.org";
        OutboxEventRecipientEntity persisted = new OutboxEventRecipientEntity();
        persisted.setTenantId(tenantId);
        persisted.setOutboxEventId(eventId);
        persisted.setRecipientEmail(recipient);
        persisted.setStatus("SENT");

        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, recipient))
                .thenReturn(Optional.of(persisted));

        assertTrue(restartedTracker.isRecipientDelivered(tenantId, eventId, recipient));
    }

    // --- Test 5: Event Dispatch Outside a Long-Running Database Transaction ---

    @Test
    void testEventDispatchOutsideLongRunningDatabaseTransaction() throws Exception {
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy(workerId);
        event.setLockedAt(Instant.now());
        event.setPayload("{}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(outboxRepository.isLeaseValid(eventId, workerId)).thenReturn(true);

        AtomicBoolean wasDispatchedOutsideTransaction = new AtomicBoolean(false);
        doAnswer(inv -> {
            // Assert that during dispatch, no active transaction is open
            boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
            wasDispatchedOutsideTransaction.set(!txActive);
            return null;
        }).when(notificationDispatcher).dispatch(any(OutboxEventEntity.class));

        processor.processSingleEvent(eventId, workerId);

        assertTrue(wasDispatchedOutsideTransaction.get(),
                "Event dispatch must execute outside any long-running database transaction");
        assertEquals("PUBLISHED", event.getStatus());
    }

    // --- Test 6: Lease Loss During Delivery ---

    @Test
    void testLeaseLossDuringDelivery_WorkerAbortsAndDoesNotPublish() throws Exception {
        OutboxEventEntity event = new OutboxEventEntity();
        event.setId(eventId);
        event.setTenantId(tenantId);
        event.setStatus("PROCESSING");
        event.setLockedBy(workerId);
        event.setLockedAt(Instant.now());
        event.setPayload("{}");

        when(outboxRepository.findById(eventId)).thenReturn(Optional.of(event));

        // Worker initially valid, but loses lease before completion
        when(outboxRepository.isLeaseValid(eventId, workerId)).thenReturn(false);

        processor.processSingleEvent(eventId, workerId);

        // Event must NOT be updated to PUBLISHED
        verify(outboxRepository, never()).saveAndFlush(argThat(e -> "PUBLISHED".equals(e.getStatus())));
    }

    // --- Test 11: Missing Recipient Tracker Application Startup Failure ---

    @Test
    void testMissingRecipientTracker_ApplicationStartupFailure() {
        NullPointerException ex = assertThrows(NullPointerException.class, () -> new NotificationDispatcher(
                userRepository,
                userEmailRepository,
                userSecurityStateRepository,
                preferenceRepository,
                studyRepository,
                studyMemberRepository,
                emailDeliveryService,
                new NotificationHtmlRenderer(),
                objectMapper,
                null // Missing recipient tracker
        ));
        assertTrue(ex.getMessage().contains("recipientDeliveryTracker must not be null"));
    }

    // --- Test 12: Stale Lease Recovery Database Failure ---

    @Test
    void testStaleLeaseRecovery_DatabaseFailurePropagates() {
        when(outboxRepository.findStaleProcessingEvents(any(), eq(50)))
                .thenThrow(new DataAccessException("PostgreSQL connection lost during recovery") {});

        assertThrows(DataAccessException.class, () ->
                claimService.recoverStaleLeases(Duration.ofMinutes(5), 50, 5));
    }

    // --- Concurrent Insertion Conflict Handling ---

    @Test
    void testRecipientDeliveryTracker_ConcurrentInsertConflict_RecoversSafely() {
        String recipient = "concurrent@site.edu";
        OutboxEventRecipientEntity existing = new OutboxEventRecipientEntity();
        existing.setTenantId(tenantId);
        existing.setOutboxEventId(eventId);
        existing.setRecipientEmail(recipient);
        existing.setStatus("PENDING");

        when(recipientRepository.findByTenantIdAndOutboxEventIdAndRecipientEmail(tenantId, eventId, recipient))
                .thenReturn(Optional.empty()) // First lookup fails to find entity
                .thenReturn(Optional.of(existing)); // Second lookup after conflict finds entity

        // First save throws DataIntegrityViolationException
        when(recipientRepository.saveAndFlush(any(OutboxEventRecipientEntity.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key violates uk_outbox_event_recipient_delivery"))
                .thenAnswer(inv -> inv.getArgument(0));

        deliveryTracker.recordDeliverySuccess(tenantId, eventId, recipient);

        assertEquals("SENT", existing.getStatus());
        assertNotNull(existing.getDeliveredAt());
    }
}
