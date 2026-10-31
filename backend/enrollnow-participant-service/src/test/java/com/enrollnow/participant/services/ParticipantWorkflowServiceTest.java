package com.enrollnow.participant.services;

import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.services.InvitationEmailService;
import com.enrollnow.identity.services.MailAttachment;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantWorkflowServiceTest {

    @Mock
    private ParticipantRepository participantRepository;
    @Mock
    private ParticipantCommentRepository commentRepository;
    @Mock
    private CommunicationRepository communicationRepository;
    @Mock
    private CommunicationRecipientRepository recipientRepository;
    @Mock
    private ParticipantContactRepository contactRepository;
    @Mock
    private ParticipantAddressRepository addressRepository;
    @Mock
    private ConsentRecordRepository consentRecordRepository;
    @Mock
    private ConsentVersionRepository consentVersionRepository;
    @Mock
    private SurveyAssignmentRepository surveyAssignmentRepository;
    @Mock
    private SurveyDefinitionRepository surveyDefinitionRepository;
    @Mock
    private StudyRepository studyRepository;
    @Mock
    private AuditRecorder auditRecorder;
    @Mock
    private InvitationEmailService invitationEmailService;

    private ParticipantWorkflowService workflowService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID participantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        workflowService = new ParticipantWorkflowService(
                participantRepository,
                commentRepository,
                communicationRepository,
                recipientRepository,
                contactRepository,
                addressRepository,
                consentRecordRepository,
                consentVersionRepository,
                surveyAssignmentRepository,
                surveyDefinitionRepository,
                studyRepository,
                auditRecorder,
                null,
                invitationEmailService
        );
    }

    @Test
    void testCreateAndGetComments() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        CreateCommentRequest request = new CreateCommentRequest();
        request.setText("Test comment note");
        request.setPinned(true);

        when(commentRepository.save(any(ParticipantComment.class))).thenAnswer(inv -> {
            ParticipantComment c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        ParticipantCommentDto created = workflowService.createComment(tenantId, participantId, userId, "Dr. Alice", request);
        assertNotNull(created);
        assertEquals("Test comment note", created.getText());
        assertTrue(created.isPinned());
        assertEquals("Dr. Alice", created.getAuthorName());

        when(commentRepository.findByTenantIdAndParticipantIdOrderByPinnedDescCreatedAtDesc(tenantId, participantId))
                .thenReturn(List.of(new ParticipantComment()));
        List<ParticipantCommentDto> list = workflowService.getComments(tenantId, participantId);
        assertEquals(1, list.size());
    }

    @Test
    void testSendAndGetEmails() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        SendEmailRequest request = new SendEmailRequest();
        request.setTo(List.of("patient@example.com"));
        request.setSubject("Appointment Confirmation");
        request.setBody("Please arrive at 10 AM.");
        request.setPinned(true);

        when(communicationRepository.save(any(Communication.class))).thenAnswer(inv -> {
            Communication c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CommunicationDto sent = workflowService.sendEmail(tenantId, participantId, userId, "Dr. Bob", request);
        assertNotNull(sent);
        assertEquals("EMAIL", sent.getChannel());
        assertEquals("Appointment Confirmation", sent.getSubject());
        assertTrue(sent.isPinned());
        assertTrue(sent.isSticky());
        assertEquals(1, sent.getRecipients().size());
        verify(invitationEmailService).sendParticipantEmail(
                List.of("patient@example.com"),
                List.of(),
                List.of(),
                null,
                "Appointment Confirmation",
                "Please arrive at 10 AM.",
                false,
                List.of()
        );
    }

    @Test
    void testSendEmail_doesNotRecordSentWhenDeliveryFails() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));
        doThrow(new IllegalStateException("Microsoft Graph delivery failed"))
                .when(invitationEmailService)
                .sendParticipantEmail(any(), any(), any(), any(), any(), any(), anyBoolean(), any());

        SendEmailRequest request = new SendEmailRequest();
        request.setTo(List.of("patient@example.com"));
        request.setSubject("Appointment Confirmation");
        request.setBody("Please arrive at 10 AM.");

        assertThrows(IllegalStateException.class,
                () -> workflowService.sendEmail(tenantId, participantId, userId, "Dr. Bob", request));
        verify(communicationRepository, never()).save(any(Communication.class));
    }

    @Test
    void testSendEmail_withValidationAndLegacyMetadata() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        SendEmailRequest request = new SendEmailRequest();
        request.setTo(List.of("recipient@example.com"));
        request.setCc(List.of("cc@example.com"));
        request.setBcc(List.of("bcc@example.com"));
        request.setReplyTo("replies@example.com");
        request.setSenderName("Dr. Jane Smith");
        request.setSubject("Study Welcome");
        request.setBody("Welcome to the study!");
        request.setSticky(true);
        request.setLastContact(true);
        request.setMessageIsHtml(true);
        EmailAttachmentRequest attachment = new EmailAttachmentRequest();
        attachment.setFileName("welcome.pdf");
        attachment.setFileContentType("application/pdf");
        attachment.setFileContentBase64("aGVsbG8=");
        request.setAttachments(List.of(attachment));

        when(communicationRepository.save(any(Communication.class))).thenAnswer(inv -> {
            Communication c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CommunicationDto sent = workflowService.sendEmail(tenantId, participantId, userId, "Jane", request);
        assertNotNull(sent);
        assertEquals("Dr. Jane Smith", sent.getSenderName());
        assertEquals("DS", sent.getAuthorInitials());
        assertEquals("replies@example.com", sent.getReplyTo());
        assertTrue(sent.isSticky());
        assertTrue(sent.isPinned());
        assertTrue(sent.isLastContact());
        assertTrue(sent.isMessageIsHtml());
        assertEquals(3, sent.getRecipients().size());
        verify(invitationEmailService).sendParticipantEmail(
                List.of("recipient@example.com"),
                List.of("cc@example.com"),
                List.of("bcc@example.com"),
                "replies@example.com",
                "Study Welcome",
                "Welcome to the study!",
                true,
                List.of(new MailAttachment("welcome.pdf", "application/pdf", "aGVsbG8="))
        );
        ArgumentCaptor<Communication> savedCommunication = ArgumentCaptor.forClass(Communication.class);
        verify(communicationRepository).save(savedCommunication.capture());
        assertTrue(savedCommunication.getValue().getMetadata().contains("welcome.pdf"));
        assertFalse(savedCommunication.getValue().getMetadata().contains("aGVsbG8="));
    }

    @Test
    void testSendEmail_invalidEmailThrowsBadRequest() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        SendEmailRequest request = new SendEmailRequest();
        request.setTo(List.of("not-an-email"));
        request.setSubject("Hello");
        request.setBody("World");

        org.springframework.web.server.ResponseStatusException ex = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> workflowService.sendEmail(tenantId, participantId, userId, "User", request)
        );
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Email is not valid"));
    }

    @Test
    void testSendEmail_duplicateEmailsThrowsBadRequest() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        SendEmailRequest request = new SendEmailRequest();
        request.setTo(List.of("test@example.com"));
        request.setCc(List.of("test@example.com"));
        request.setSubject("Hello");
        request.setBody("World");

        org.springframework.web.server.ResponseStatusException ex = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> workflowService.sendEmail(tenantId, participantId, userId, "User", request)
        );
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Each email address should be unique"));
    }

    @Test
    void testUpdateEmailLog_togglesStickyAndGlobal() {
        UUID commId = UUID.randomUUID();
        Communication c = new Communication();
        c.setId(commId);
        c.setTenantId(tenantId);
        c.setParticipantId(participantId);
        c.setChannel("EMAIL");
        c.setPinned(false);
        c.setMetadata("{\"lastContact\":false}");

        when(communicationRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, commId))
                .thenReturn(Optional.of(c));
        when(communicationRepository.save(any(Communication.class))).thenAnswer(inv -> inv.getArgument(0));

        CommunicationDto updated = workflowService.updateEmailLog(tenantId, participantId, commId, userId, Map.of(
                "sticky", true,
                "global", true
        ));
        assertNotNull(updated);
        assertTrue(updated.isPinned());
        assertTrue(updated.isSticky());
        assertTrue(updated.isGlobal());
    }

    @Test
    void testSendSms() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        SendSmsRequest request = new SendSmsRequest();
        request.setToPhone("+12155550199");
        request.setBody("Reminder: visit tomorrow.");

        when(communicationRepository.save(any(Communication.class))).thenAnswer(inv -> {
            Communication c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CommunicationDto sent = workflowService.sendSms(tenantId, participantId, userId, "Dr. Bob", request);
        assertNotNull(sent);
        assertEquals("SMS", sent.getChannel());
        assertEquals("Reminder: visit tomorrow.", sent.getBody());
    }

    @Test
    void testCreateContactAndAddress() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        CreateContactPersonRequest contactReq = new CreateContactPersonRequest();
        contactReq.setContactName("Mary Doe");
        contactReq.setRelationship("Mother");
        contactReq.setContactType("PHONE");
        contactReq.setContactValue("+15551234567");
        contactReq.setPreferred(true);

        when(contactRepository.save(any(ParticipantContact.class))).thenAnswer(inv -> {
            ParticipantContact c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        ParticipantContactDto contact = workflowService.createContact(tenantId, participantId, userId, contactReq);
        assertNotNull(contact);
        assertEquals("Mary Doe", contact.getContactName());
        assertEquals("Mother", contact.getRelationship());
        assertTrue(contact.isPreferred());

        CreateAddressRequest addressReq = new CreateAddressRequest();
        addressReq.setAddressLine1("123 Main St");
        addressReq.setCity("Philadelphia");
        addressReq.setStateRegion("PA");
        addressReq.setPostalCode("19104");

        when(addressRepository.save(any(ParticipantAddress.class))).thenAnswer(inv -> {
            ParticipantAddress a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        ParticipantAddressDto addr = workflowService.createAddress(tenantId, participantId, userId, addressReq);
        assertNotNull(addr);
        assertEquals("123 Main St", addr.getAddressLine1());
        assertEquals("Philadelphia", addr.getCity());
    }

    @Test
    void testUpdateContact_updatesFieldsAndMaintainsPreferredExclusivity() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        UUID contactId = UUID.randomUUID();
        ParticipantContact existing = new ParticipantContact();
        existing.setId(contactId);
        existing.setTenantId(tenantId);
        existing.setParticipantId(participantId);
        existing.setContactType("PHONE");
        existing.setContactValue("+15551234567");
        existing.setPreferred(false);
        existing.setActive(true);

        UUID otherContactId = UUID.randomUUID();
        ParticipantContact other = new ParticipantContact();
        other.setId(otherContactId);
        other.setTenantId(tenantId);
        other.setParticipantId(participantId);
        other.setPreferred(true);
        other.setActive(true);

        when(contactRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, contactId))
                .thenReturn(Optional.of(existing));
        when(contactRepository.findByTenantIdAndParticipantId(tenantId, participantId))
                .thenReturn(new ArrayList<>(List.of(existing, other)));
        when(contactRepository.save(any(ParticipantContact.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateContactPersonRequest updateReq = new UpdateContactPersonRequest();
        updateReq.setContactValue("+15559876543");
        updateReq.setIsPreferred(true);
        updateReq.setRelationship("Guardian");
        updateReq.setCanLeaveMessage(false);

        ParticipantContactDto updated = workflowService.updateContact(tenantId, participantId, contactId, userId, updateReq);
        assertNotNull(updated);
        assertEquals("+15559876543", updated.getContactValue());
        assertEquals("Guardian", updated.getRelationship());
        assertTrue(updated.isPreferred());
        assertFalse(updated.isCanLeaveMessage());
        // Verify other contact's preferred flag was cleared
        assertFalse(other.isPreferred());
    }

    @Test
    void testToggleContactActive_archivingClearsPreferred() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        UUID contactId = UUID.randomUUID();
        ParticipantContact existing = new ParticipantContact();
        existing.setId(contactId);
        existing.setTenantId(tenantId);
        existing.setParticipantId(participantId);
        existing.setPreferred(true);
        existing.setActive(true);

        when(contactRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, contactId))
                .thenReturn(Optional.of(existing));
        when(contactRepository.save(any(ParticipantContact.class))).thenAnswer(inv -> inv.getArgument(0));

        ParticipantContactDto archived = workflowService.toggleContactActive(tenantId, participantId, contactId, userId, false);
        assertNotNull(archived);
        assertFalse(archived.isActive());
        assertFalse(archived.isPreferred());

        ParticipantContactDto restored = workflowService.toggleContactActive(tenantId, participantId, contactId, userId, true);
        assertNotNull(restored);
        assertTrue(restored.isActive());
    }

    @Test
    void testUpdateAddress_andToggleAddressActive() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        UUID addressId = UUID.randomUUID();
        ParticipantAddress existing = new ParticipantAddress();
        existing.setId(addressId);
        existing.setTenantId(tenantId);
        existing.setParticipantId(participantId);
        existing.setAddressLine1("123 Old St");
        existing.setCity("Philadelphia");
        existing.setActive(true);

        when(addressRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, addressId))
                .thenReturn(Optional.of(existing));
        when(addressRepository.save(any(ParticipantAddress.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateAddressRequest updateReq = new UpdateAddressRequest();
        updateReq.setAddressLine1("456 New Ave");
        updateReq.setCity("Pittsburgh");
        updateReq.setPostalCode("15213");

        ParticipantAddressDto updated = workflowService.updateAddress(tenantId, participantId, addressId, userId, updateReq);
        assertNotNull(updated);
        assertEquals("456 New Ave", updated.getAddressLine1());
        assertEquals("Pittsburgh", updated.getCity());

        ParticipantAddressDto archived = workflowService.toggleAddressActive(tenantId, participantId, addressId, userId, false);
        assertFalse(archived.isActive());
    }

    @Test
    void testRecordConsent() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        UUID versionId = UUID.randomUUID();
        RecordConsentRequest req = new RecordConsentRequest();
        req.setStudyId(studyId);
        req.setConsentVersionId(versionId);
        req.setStatus("CONSENTED");

        when(consentRecordRepository.save(any(ConsentRecord.class))).thenAnswer(inv -> {
            ConsentRecord r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        ConsentDto consent = workflowService.recordConsent(tenantId, participantId, userId, "Dr. Alice", req);
        assertNotNull(consent);
        assertEquals("CONSENTED", consent.getStatus());
        assertEquals(studyId, consent.getStudyId());
    }

    @Test
    void testAssignSurvey() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        UUID surveyDefId = UUID.randomUUID();
        AssignSurveyRequest req = new AssignSurveyRequest();
        req.setSurveyDefinitionId(surveyDefId);
        req.setStudyId(studyId);

        when(surveyAssignmentRepository.save(any(SurveyAssignment.class))).thenAnswer(inv -> {
            SurveyAssignment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        SurveyAssignmentDto assigned = workflowService.assignSurvey(tenantId, participantId, userId, req);
        assertNotNull(assigned);
        assertEquals("ASSIGNED", assigned.getStatus());
        assertEquals(studyId, assigned.getStudyId());
    }
    @Test
    void testUpdateComment_unauthorizedThrowsAccessDenied() {
        UUID otherUserId = UUID.randomUUID();
        ParticipantComment comment = new ParticipantComment();
        comment.setId(UUID.randomUUID());
        comment.setTenantId(tenantId);
        comment.setParticipantId(participantId);
        comment.setAuthorId(otherUserId);
        comment.setText("Original");

        when(commentRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, comment.getId()))
                .thenReturn(Optional.of(comment));

        UpdateCommentRequest updateReq = new UpdateCommentRequest();
        updateReq.setText("Hacked text");

        assertThrows(AccessDeniedException.class, () ->
                workflowService.updateComment(tenantId, participantId, comment.getId(), userId, false, updateReq));
    }

    @Test
    void testUpdateComment_authorOrAdminAllowed() {
        ParticipantComment comment = new ParticipantComment();
        comment.setId(UUID.randomUUID());
        comment.setTenantId(tenantId);
        comment.setParticipantId(participantId);
        comment.setAuthorId(userId);
        comment.setText("Original");

        when(commentRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, comment.getId()))
                .thenReturn(Optional.of(comment));
        when(commentRepository.save(any(ParticipantComment.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateCommentRequest updateReq = new UpdateCommentRequest();
        updateReq.setText("Updated text");

        ParticipantCommentDto updated = workflowService.updateComment(tenantId, participantId, comment.getId(), userId, false, updateReq);
        assertEquals("Updated text", updated.getText());
    }

    @Test
    void testDeleteComment_unauthorizedThrowsAccessDenied() {
        UUID otherUserId = UUID.randomUUID();
        ParticipantComment comment = new ParticipantComment();
        comment.setId(UUID.randomUUID());
        comment.setTenantId(tenantId);
        comment.setParticipantId(participantId);
        comment.setAuthorId(otherUserId);

        when(commentRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, comment.getId()))
                .thenReturn(Optional.of(comment));

        assertThrows(AccessDeniedException.class, () ->
                workflowService.deleteComment(tenantId, participantId, comment.getId(), userId, false));
    }

    @Test
    void testSendSms_exceedsLengthThrowsBadRequest() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        SendSmsRequest req = new SendSmsRequest();
        req.setToPhone("+12155550199");
        req.setBody("A".repeat(1601)); // Exceeds 1600 limit

        assertThrows(ResponseStatusException.class, () ->
                workflowService.sendSms(tenantId, participantId, userId, "Dr. Bob", req));
    }

    @Test
    void testPinCommunication() {
        Communication comm = new Communication();
        comm.setId(UUID.randomUUID());
        comm.setTenantId(tenantId);
        comm.setParticipantId(participantId);
        comm.setChannel("SMS");
        comm.setPinned(false);

        
        when(communicationRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, comm.getId()))
                .thenReturn(Optional.of(comm));
        when(communicationRepository.save(any(Communication.class))).thenAnswer(inv -> inv.getArgument(0));

        CommunicationDto pinned = workflowService.pinCommunication(tenantId, participantId, comm.getId(), userId, true);
        assertTrue(pinned.isPinned());
    }
    @Test
    void testSendSms_unconfiguredGatewayMarkedQueued() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        SendSmsRequest req = new SendSmsRequest();
        req.setToPhone("+12155550199");
        req.setBody("Hello from clinic");

        when(communicationRepository.save(any(Communication.class))).thenAnswer(inv -> {
            Communication c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CommunicationDto sent = workflowService.sendSms(tenantId, participantId, userId, "Dr. Alice", req);
        assertNotNull(sent);
        assertEquals("QUEUED", sent.getStatus());
        assertNull(sent.getSentAt());
    }

    @Test
    void testSendSms_duplicateProtectionReturnsExisting() {
        Participant participant = new Participant();
        participant.setId(participantId);
        participant.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));

        Communication existing = new Communication();
        existing.setId(UUID.randomUUID());
        existing.setTenantId(tenantId);
        existing.setParticipantId(participantId);
        existing.setChannel("SMS");
        existing.setDirection("OUTBOUND");
        existing.setBodySnapshot("Duplicate body");
        existing.setStatus("SENT");
        existing.setCreatedAt(java.time.OffsetDateTime.now().minusSeconds(5));

        CommunicationRecipient rec = new CommunicationRecipient();
        rec.setRecipientType("TO");
        rec.setRecipientValue("+12155550199");
        existing.addRecipient(rec);

        when(communicationRepository.findByTenantIdAndParticipantIdAndChannelOrderByPinnedDescCreatedAtDesc(tenantId, participantId, "SMS"))
                .thenReturn(List.of(existing));

        SendSmsRequest req = new SendSmsRequest();
        req.setToPhone("+12155550199");
        req.setBody("Duplicate body");

        CommunicationDto result = workflowService.sendSms(tenantId, participantId, userId, "Dr. Alice", req);
        assertEquals(existing.getId(), result.getId());
        assertEquals("SENT", result.getStatus());
        verify(communicationRepository, never()).save(any());
    }

    @Test
    void testUpdateSmsStatusByExternalMessageId_successAndTerminalProtection() {
        Communication comm = new Communication();
        comm.setId(UUID.randomUUID());
        comm.setExternalMessageId("SM-12345");
        comm.setChannel("SMS");
        comm.setStatus("SENT");

        when(communicationRepository.findByExternalMessageId("SM-12345")).thenReturn(Optional.of(comm));
        when(communicationRepository.save(any(Communication.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Delivery callback updates status to DELIVERED
        boolean updated = workflowService.updateSmsStatusByExternalMessageId("SM-12345", "delivered");
        assertTrue(updated);
        assertEquals("DELIVERED", comm.getStatus());
        assertNotNull(comm.getCompletedAt());

        // 2. Out-of-order callback (receiving "sent" after "delivered") does not regress terminal status
        boolean ignored = workflowService.updateSmsStatusByExternalMessageId("SM-12345", "sent");
        assertTrue(ignored);
        assertEquals("DELIVERED", comm.getStatus());

        // 3. Unknown external message ID returns false
        when(communicationRepository.findByExternalMessageId("SM-UNKNOWN")).thenReturn(Optional.empty());
        boolean unknown = workflowService.updateSmsStatusByExternalMessageId("SM-UNKNOWN", "delivered");
        assertFalse(unknown);
    }
}
