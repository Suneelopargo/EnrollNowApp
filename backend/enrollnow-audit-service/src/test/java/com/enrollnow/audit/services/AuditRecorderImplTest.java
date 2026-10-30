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
}