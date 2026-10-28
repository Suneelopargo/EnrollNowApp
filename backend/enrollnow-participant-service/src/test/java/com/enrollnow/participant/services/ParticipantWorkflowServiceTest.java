package com.enrollnow.participant.services;

import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
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
                auditRecorder
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
        assertEquals(1, sent.getRecipients().size());
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
}
