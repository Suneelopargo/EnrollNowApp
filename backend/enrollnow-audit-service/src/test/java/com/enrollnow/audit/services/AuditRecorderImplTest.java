package com.enrollnow.audit.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.enrollnow.audit.models.AuditEvent;
import com.enrollnow.audit.models.EntityChangeHistory;
import com.enrollnow.audit.repositories.AuditEventRepository;
import com.enrollnow.audit.repositories.EntityChangeHistoryRepository;
import com.enrollnow.common.audit.AuditChange;
import com.enrollnow.common.audit.AuditEventCommand;
import java.util.Optional;

import com.enrollnow.common.audit.CurrentActorProvider;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditRequest;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.times;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuditRecorderImplTest {

    @Mock
    private AuditEventRepository auditEventRepository;

    @Mock
    private EntityChangeHistoryRepository entityChangeHistoryRepository;
    
    @Mock
    private CurrentActorProvider currentActorProvider;

    private AuditRecorderImpl auditRecorder;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        objectMapper = new ObjectMapper();

        auditRecorder = new AuditRecorderImpl(
                auditEventRepository,
                entityChangeHistoryRepository,
                currentActorProvider,
                objectMapper
        );
    }

    @Test
    void shouldRecordAuditEventAndFieldLevelChange() {

        UUID tenantId = UUID.randomUUID();
        UUID actorUserId = UUID.randomUUID();
        UUID entityId = UUID.randomUUID();
        UUID auditEventId = UUID.randomUUID();
        UUID correlationId = UUID.randomUUID();

        AuditEventCommand command = new AuditEventCommand(
                tenantId,
                actorUserId,
                "USER",
                entityId,
                "STUDY_PERMISSION_CHANGED",
                "Study permission changed",
                "API",
                correlationId,
                "request-123",
                Map.of(
                        "studyPermission", "STUDY_RA"
                ),
                Map.of(
                        "studyPermission", "STUDY_ADMIN"
                ),
                List.of(
                        new AuditChange(
                                "studyPermission",
                                "STUDY_RA",
                                "STUDY_ADMIN"
                        )
                )
        );

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(auditEventId);
                    return event;
                });
        when(currentActorProvider.getCurrentUserId())
        .thenReturn(Optional.of(actorUserId));
        auditRecorder.record(command);

        ArgumentCaptor<AuditEvent> eventCaptor =
                ArgumentCaptor.forClass(AuditEvent.class);

        verify(auditEventRepository).save(eventCaptor.capture());

        AuditEvent savedEvent = eventCaptor.getValue();

        assertEquals(tenantId, savedEvent.getTenantId());
        assertEquals(actorUserId, savedEvent.getActorUserId());
        assertEquals("USER", savedEvent.getEntityType());
        assertEquals(entityId, savedEvent.getEntityId());
        assertEquals(
                "STUDY_PERMISSION_CHANGED",
                savedEvent.getAction()
        );
        assertEquals("API", savedEvent.getSource());
        assertEquals(correlationId, savedEvent.getCorrelationId());
        assertEquals("request-123", savedEvent.getRequestId());

        assertNotNull(savedEvent.getOccurredAt());
        assertNotNull(savedEvent.getCreatedAt());

        ArgumentCaptor<EntityChangeHistory> historyCaptor =
                ArgumentCaptor.forClass(EntityChangeHistory.class);

        verify(entityChangeHistoryRepository)
                .save(historyCaptor.capture());

        EntityChangeHistory history = historyCaptor.getValue();

        assertEquals(tenantId, history.getTenantId());
        assertEquals(auditEventId, history.getAuditEventId());
        assertEquals("USER", history.getEntityType());
        assertEquals(entityId, history.getEntityId());
        assertEquals("studyPermission", history.getFieldName());
        assertEquals(
                "STUDY_RA",
                history.getPreviousValue().asText()
        );

        assertEquals(
                "STUDY_ADMIN",
                history.getNewValue().asText()
        );
        assertNotNull(history.getChangedAt());
    }
    
    @Test
    void shouldRecordAuditEventWithoutFieldLevelChanges() {

        UUID tenantId = UUID.randomUUID();
        UUID actorUserId = UUID.randomUUID();
        UUID entityId = UUID.randomUUID();
        UUID auditEventId = UUID.randomUUID();

        AuditEventCommand command = new AuditEventCommand(
                tenantId,
                actorUserId,
                "USER",
                entityId,
                "USER_CREATED",
                "User account created",
                "API",
                UUID.randomUUID(),
                "request-456",
                null,
                Map.of(
                        "status", "ACTIVE"
                ),
                null
        );

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(auditEventId);
                    return event;
                });

        auditRecorder.record(command);

        verify(auditEventRepository).save(any(AuditEvent.class));

        verify(entityChangeHistoryRepository, never())
                .save(any(EntityChangeHistory.class));
    }
    
    @Test
    void shouldUseCurrentAuthenticatedActorWhenCommandActorIsNull() {

        UUID tenantId = UUID.randomUUID();
        UUID authenticatedUserId = UUID.randomUUID();
        UUID entityId = UUID.randomUUID();
        UUID auditEventId = UUID.randomUUID();

        AuditEventCommand command = new AuditEventCommand(
                tenantId,
                null,
                "USER",
                entityId,
                "USER_CREATED",
                "User account created",
                "API",
                UUID.randomUUID(),
                "request-789",
                null,
                Map.of(
                        "status", "ACTIVE"
                ),
                null
        );

        when(currentActorProvider.getCurrentUserId())
                .thenReturn(Optional.of(authenticatedUserId));

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(auditEventId);
                    return event;
                });

        auditRecorder.record(command);

        ArgumentCaptor<AuditEvent> eventCaptor =
                ArgumentCaptor.forClass(AuditEvent.class);

        verify(auditEventRepository).save(eventCaptor.capture());

        AuditEvent savedEvent = eventCaptor.getValue();

        assertEquals(
                authenticatedUserId,
                savedEvent.getActorUserId()
        );
    }
    
    @Test
    void shouldRecordChildChangeForDifferentEntity() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID studyId = UUID.randomUUID();
        UUID actorUserId = UUID.randomUUID();

        when(currentActorProvider.getCurrentUserId())
                .thenReturn(Optional.of(actorUserId));

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(UUID.randomUUID());
                    return event;
                });

        AuditEventCommand command = new AuditEventCommand(
                tenantId,
                null,
                "USER",
                userId,
                "USER_ACCESS_UPDATED",
                "User access updated",
                "API",
                null,
                null,
                null,
                null,
                List.of(
                        new AuditChange(
                                "STUDY",
                                studyId,
                                "studyPermission",
                                "STUDY_RA",
                                "STUDY_ADMIN"
                        )
                )
        );

        auditRecorder.record(command);

        ArgumentCaptor<EntityChangeHistory> historyCaptor =
                ArgumentCaptor.forClass(EntityChangeHistory.class);

        verify(entityChangeHistoryRepository)
                .save(historyCaptor.capture());

        EntityChangeHistory history = historyCaptor.getValue();

        assertEquals("STUDY", history.getEntityType());
        assertEquals(studyId, history.getEntityId());

        assertEquals(
                "studyPermission",
                history.getFieldName()
        );

        assertEquals(
                "STUDY_RA",
                history.getPreviousValue().asText()
        );

        assertEquals(
                "STUDY_ADMIN",
                history.getNewValue().asText()
        );
    }
    
    @Test
    void shouldAutomaticallyCreateChangesFromSingleEntitySnapshot() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID auditEventId = UUID.randomUUID();

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(auditEventId);
                    return event;
                });

        Map<String, Object> before = Map.of(
                "firstName", "Ravi",
                "lastName", "Kumar",
                "title", "Coordinator"
        );

        Map<String, Object> after = Map.of(
                "firstName", "Ravi Test",
                "lastName", "Kumar",
                "title", "Manager"
        );

        AuditRequest request =
                new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_UPDATED",
                        "User updated",
                        "API",
                        List.of(
                                new AuditEntitySnapshot(
                                        "USER",
                                        userId,
                                        before,
                                        after
                                )
                        )
                );

        auditRecorder.record(request);

        ArgumentCaptor<AuditEvent> eventCaptor =
                ArgumentCaptor.forClass(AuditEvent.class);

        verify(auditEventRepository)
                .save(eventCaptor.capture());

        AuditEvent event = eventCaptor.getValue();

        assertEquals(tenantId, event.getTenantId());
        assertEquals("USER", event.getEntityType());
        assertEquals(userId, event.getEntityId());
        assertEquals("USER_UPDATED", event.getAction());

        // Single parent entity retains its snapshots
        assertEquals(before, event.getBeforeData());
        assertEquals(after, event.getAfterData());

        ArgumentCaptor<EntityChangeHistory> historyCaptor =
                ArgumentCaptor.forClass(EntityChangeHistory.class);

        verify(entityChangeHistoryRepository, times(2))
                .save(historyCaptor.capture());

        List<EntityChangeHistory> histories =
                historyCaptor.getAllValues();

        assertEquals(2, histories.size());

        EntityChangeHistory firstNameChange =
                histories.stream()
                        .filter(h ->
                                "firstName".equals(h.getFieldName()))
                        .findFirst()
                        .orElseThrow();

        assertEquals(
                "Ravi",
                firstNameChange.getPreviousValue().asText()
        );

        assertEquals(
                "Ravi Test",
                firstNameChange.getNewValue().asText()
        );

        EntityChangeHistory titleChange =
                histories.stream()
                        .filter(h ->
                                "title".equals(h.getFieldName()))
                        .findFirst()
                        .orElseThrow();

        assertEquals(
                "Coordinator",
                titleChange.getPreviousValue().asText()
        );

        assertEquals(
                "Manager",
                titleChange.getNewValue().asText()
        );
    }
    
    @Test
    void shouldAutomaticallyCreateChangesForMultipleEntities() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID studyId = UUID.randomUUID();
        UUID auditEventId = UUID.randomUUID();

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(auditEventId);
                    return event;
                });

        AuditEntitySnapshot userSnapshot =
                new AuditEntitySnapshot(
                        "USER",
                        userId,
                        Map.of(
                                "sitePermission", "SITE_MANAGER"
                        ),
                        Map.of(
                                "sitePermission", "SITE_ADMIN"
                        )
                );

        AuditEntitySnapshot studySnapshot =
                new AuditEntitySnapshot(
                        "STUDY",
                        studyId,
                        Map.of(
                                "studyPermission", "STUDY_RA"
                        ),
                        Map.of(
                                "studyPermission", "STUDY_LEADER"
                        )
                );

        AuditRequest request =
                new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_ACCESS_UPDATED",
                        "User access updated",
                        "API",
                        List.of(
                                userSnapshot,
                                studySnapshot
                        )
                );

        auditRecorder.record(request);

        ArgumentCaptor<AuditEvent> eventCaptor =
                ArgumentCaptor.forClass(AuditEvent.class);

        verify(auditEventRepository)
                .save(eventCaptor.capture());

        AuditEvent event = eventCaptor.getValue();

        assertEquals(
                "USER_ACCESS_UPDATED",
                event.getAction()
        );

        /*
         * Multi-entity operation:
         * field-level history is authoritative.
         */
        assertNull(event.getBeforeData());
        assertNull(event.getAfterData());

        ArgumentCaptor<EntityChangeHistory> historyCaptor =
                ArgumentCaptor.forClass(
                        EntityChangeHistory.class
                );

        verify(entityChangeHistoryRepository, times(2))
                .save(historyCaptor.capture());

        List<EntityChangeHistory> histories =
                historyCaptor.getAllValues();

        EntityChangeHistory userHistory =
                histories.stream()
                        .filter(h ->
                                "USER".equals(h.getEntityType()))
                        .findFirst()
                        .orElseThrow();

        assertEquals(userId, userHistory.getEntityId());
        assertEquals(
                "sitePermission",
                userHistory.getFieldName()
        );

        assertEquals(
                "SITE_MANAGER",
                userHistory.getPreviousValue().asText()
        );

        assertEquals(
                "SITE_ADMIN",
                userHistory.getNewValue().asText()
        );

        EntityChangeHistory studyHistory =
                histories.stream()
                        .filter(h ->
                                "STUDY".equals(h.getEntityType()))
                        .findFirst()
                        .orElseThrow();

        assertEquals(studyId, studyHistory.getEntityId());

        assertEquals(
                "studyPermission",
                studyHistory.getFieldName()
        );

        assertEquals(
                "STUDY_RA",
                studyHistory.getPreviousValue().asText()
        );

        assertEquals(
                "STUDY_LEADER",
                studyHistory.getNewValue().asText()
        );
    }
    
    @Test
    void shouldNotRecordAnythingWhenSnapshotsHaveNoChanges() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Map<String, Object> before = Map.of(
                "firstName", "Ravi",
                "lastName", "Kumar",
                "title", "Coordinator"
        );

        Map<String, Object> after = Map.of(
                "firstName", "Ravi",
                "lastName", "Kumar",
                "title", "Coordinator"
        );

        AuditRequest request =
                new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_UPDATED",
                        "User updated",
                        "API",
                        List.of(
                                new AuditEntitySnapshot(
                                        "USER",
                                        userId,
                                        before,
                                        after
                                )
                        )
                );

        auditRecorder.record(request);

        verify(auditEventRepository, never())
                .save(any(AuditEvent.class));

        verify(entityChangeHistoryRepository, never())
                .save(any(EntityChangeHistory.class));
    }
    
    @Test
    void shouldAutomaticallyCreateChangesForCreatedEntity() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID auditEventId = UUID.randomUUID();

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(auditEventId);
                    return event;
                });

        Map<String, Object> after = Map.of(
                "firstName", "Ravi",
                "lastName", "Kumar",
                "email", "ravi@example.com",
                "status", "ACTIVE"
        );

        AuditRequest request =
                new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_CREATED",
                        "User account created",
                        "API",
                        List.of(
                                new AuditEntitySnapshot(
                                        "USER",
                                        userId,
                                        null,
                                        after
                                )
                        )
                );

        auditRecorder.record(request);

        ArgumentCaptor<AuditEvent> eventCaptor =
                ArgumentCaptor.forClass(AuditEvent.class);

        verify(auditEventRepository)
                .save(eventCaptor.capture());

        AuditEvent event = eventCaptor.getValue();

        assertEquals("USER_CREATED", event.getAction());
        assertNull(event.getBeforeData());
        assertEquals(after, event.getAfterData());

        ArgumentCaptor<EntityChangeHistory> historyCaptor =
                ArgumentCaptor.forClass(EntityChangeHistory.class);

        verify(entityChangeHistoryRepository, times(4))
                .save(historyCaptor.capture());

        List<EntityChangeHistory> histories =
                historyCaptor.getAllValues();

        assertEquals(4, histories.size());

        EntityChangeHistory firstNameChange =
                histories.stream()
                        .filter(h ->
                                "firstName".equals(h.getFieldName()))
                        .findFirst()
                        .orElseThrow();

        assertEquals(
                "Ravi",
                firstNameChange.getNewValue().asText()
        );

        assertTrue(
                firstNameChange.getPreviousValue().isNull()
        );
    }
    
    @Test
    void shouldAutomaticallyCreateChangesForDeletedEntity() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID auditEventId = UUID.randomUUID();

        when(auditEventRepository.save(any(AuditEvent.class)))
                .thenAnswer(invocation -> {
                    AuditEvent event = invocation.getArgument(0);
                    event.setId(auditEventId);
                    return event;
                });

        Map<String, Object> before = Map.of(
                "firstName", "Ravi",
                "lastName", "Kumar",
                "status", "ACTIVE"
        );

        AuditRequest request =
                new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_DELETED",
                        "User deleted",
                        "API",
                        List.of(
                                new AuditEntitySnapshot(
                                        "USER",
                                        userId,
                                        before,
                                        null
                                )
                        )
                );

        auditRecorder.record(request);

        ArgumentCaptor<AuditEvent> eventCaptor =
                ArgumentCaptor.forClass(AuditEvent.class);

        verify(auditEventRepository)
                .save(eventCaptor.capture());

        AuditEvent event = eventCaptor.getValue();

        assertEquals("USER_DELETED", event.getAction());
        assertEquals(before, event.getBeforeData());
        assertNull(event.getAfterData());

        ArgumentCaptor<EntityChangeHistory> historyCaptor =
                ArgumentCaptor.forClass(EntityChangeHistory.class);

        verify(entityChangeHistoryRepository, times(3))
                .save(historyCaptor.capture());

        List<EntityChangeHistory> histories =
                historyCaptor.getAllValues();

        EntityChangeHistory statusChange =
                histories.stream()
                        .filter(h ->
                                "status".equals(h.getFieldName()))
                        .findFirst()
                        .orElseThrow();

        assertEquals(
                "ACTIVE",
                statusChange.getPreviousValue().asText()
        );

        assertTrue(
                statusChange.getNewValue().isNull()
        );
    }
}