package com.enrollnow.notification.services;

import com.enrollnow.identity.services.InvitationEmailService;
import com.enrollnow.participant.models.Communication;
import com.enrollnow.participant.repositories.CommunicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEmailDeliveryServiceTest {

    @Mock
    private InvitationEmailService invitationEmailService;
    @Mock
    private CommunicationRepository communicationRepository;

    private NotificationEmailDeliveryService deliveryService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final UUID participantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        deliveryService = new NotificationEmailDeliveryService(invitationEmailService, communicationRepository);
    }

    @Test
    void testSendEmail_Success_RecordsSentStatusAndSentAtTimestamp() {
        boolean result = deliveryService.sendEmail(
                tenantId,
                studyId,
                participantId,
                "user@example.com",
                "Test Subject",
                "<p>Test Body</p>",
                "TEMPLATE_01"
        );

        assertTrue(result);

        ArgumentCaptor<Communication> captor = ArgumentCaptor.forClass(Communication.class);
        verify(communicationRepository, times(1)).save(captor.capture());
        Communication saved = captor.getValue();

        assertEquals("SENT", saved.getStatus());
        assertNotNull(saved.getSentAt(), "sentAt must be populated for successful email delivery");
        assertEquals("EMAIL", saved.getChannel());
        assertEquals("OUTBOUND", saved.getDirection());
        assertEquals("Test Subject", saved.getSubjectSnapshot());
    }

    @Test
    void testSendEmail_Failure_RecordsFailedStatusAndNullSentAtTimestamp() {
        doThrow(new RuntimeException("Graph API service unavailable"))
                .when(invitationEmailService).sendParticipantEmail(any(), any(), any(), any(), any(), any(), anyBoolean(), any());

        boolean result = deliveryService.sendEmail(
                tenantId,
                studyId,
                participantId,
                "user@example.com",
                "Test Subject",
                "<p>Test Body</p>",
                "TEMPLATE_01"
        );

        assertFalse(result);

        ArgumentCaptor<Communication> captor = ArgumentCaptor.forClass(Communication.class);
        verify(communicationRepository, times(1)).save(captor.capture());
        Communication saved = captor.getValue();

        assertEquals("FAILED", saved.getStatus());
        assertNull(saved.getSentAt(), "sentAt must be NULL for failed email delivery");
    }
}
