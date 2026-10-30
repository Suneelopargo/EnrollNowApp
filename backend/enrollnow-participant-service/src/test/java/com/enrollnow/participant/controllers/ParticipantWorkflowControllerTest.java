package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantWorkflowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantWorkflowControllerTest {

    @Mock private ParticipantWorkflowService workflowService;
    @Mock private SiteAuthorizationService siteAuthorizationService;

    private ParticipantWorkflowController controller;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID participantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID userId = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @BeforeEach
    void setUp() {
        controller = new ParticipantWorkflowController(workflowService, siteAuthorizationService);
    }

    private void mockAuth() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
    }

    @Test
    void getComments_returnsComments() {
        mockAuth();
        when(workflowService.getComments(tenantId, participantId)).thenReturn(List.of(new ParticipantCommentDto()));

        ResponseEntity<List<ParticipantCommentDto>> res = controller.getComments(participantId, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
    }

    @Test
    void createComment_returnsCreated() {
        mockAuth();
        CreateCommentRequest req = new CreateCommentRequest();
        req.setText("New Note");

        ParticipantCommentDto dto = new ParticipantCommentDto();
        dto.setText("New Note");
        when(workflowService.createComment(eq(tenantId), eq(participantId), eq(userId), any(), eq(req))).thenReturn(dto);

        ResponseEntity<ParticipantCommentDto> res = controller.createComment(participantId, req, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().getText()).isEqualTo("New Note");
    }

    @Test
    void sendEmail_returnsCreated() {
        mockAuth();
        SendEmailRequest req = new SendEmailRequest();
        req.setTo(List.of("test@example.com"));
        req.setSubject("Test");
        req.setBody("Hello");

        CommunicationDto dto = new CommunicationDto();
        dto.setSubject("Test");
        when(workflowService.sendEmail(eq(tenantId), eq(participantId), eq(userId), any(), eq(req))).thenReturn(dto);

        ResponseEntity<CommunicationDto> res = controller.sendEmail(participantId, req, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().getSubject()).isEqualTo("Test");
    }

    @Test
    void sendSms_returnsCreated() {
        mockAuth();
        SendSmsRequest req = new SendSmsRequest();
        req.setToPhone("+12155550100");
        req.setBody("SMS message");

        CommunicationDto dto = new CommunicationDto();
        dto.setBody("SMS message");
        when(workflowService.sendSms(eq(tenantId), eq(participantId), eq(userId), any(), eq(req))).thenReturn(dto);

        ResponseEntity<CommunicationDto> res = controller.sendSms(participantId, req, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void recordConsent_returnsCreated() {
        mockAuth();
        RecordConsentRequest req = new RecordConsentRequest();
        req.setStudyId(UUID.randomUUID());
        req.setConsentVersionId(UUID.randomUUID());

        ConsentDto dto = new ConsentDto();
        dto.setStatus("CONSENTED");
        when(workflowService.recordConsent(eq(tenantId), eq(participantId), eq(userId), any(), eq(req))).thenReturn(dto);

        ResponseEntity<ConsentDto> res = controller.recordConsent(participantId, req, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().getStatus()).isEqualTo("CONSENTED");
    }

    @Test
    void assignForm_returnsCreated() {
        mockAuth();
        AssignSurveyRequest req = new AssignSurveyRequest();
        req.setSurveyDefinitionId(UUID.randomUUID());

        SurveyAssignmentDto dto = new SurveyAssignmentDto();
        dto.setStatus("ASSIGNED");
        when(workflowService.assignSurvey(eq(tenantId), eq(participantId), eq(userId), eq(req))).thenReturn(dto);

        ResponseEntity<SurveyAssignmentDto> res = controller.assignForm(participantId, req, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().getStatus()).isEqualTo("ASSIGNED");
    }
    @Test
    void updateComment_passesCanAccessAdmin() {
        mockAuth();
        UUID commentId = UUID.randomUUID();
        UpdateCommentRequest req = new UpdateCommentRequest();
        req.setText("Updated text");

        when(siteAuthorizationService.canAccessSiteAdmin(any(UUID.class), isNull())).thenReturn(true);
        ParticipantCommentDto dto = new ParticipantCommentDto();
        dto.setText("Updated text");
        when(workflowService.updateComment(eq(tenantId), eq(participantId), eq(commentId), eq(userId), eq(true), eq(req)))
                .thenReturn(dto);

        ResponseEntity<ParticipantCommentDto> res = controller.updateComment(participantId, commentId, req, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().getText()).isEqualTo("Updated text");
    }

    @Test
    void pinSms_returnsOk() {
        mockAuth();
        UUID smsId = UUID.randomUUID();
        PinContactLogRequest req = new PinContactLogRequest();
        req.setSticky(true);

        CommunicationDto dto = new CommunicationDto();
        dto.setPinned(true);
        when(workflowService.pinCommunication(tenantId, participantId, smsId, userId, true)).thenReturn(dto);

        ResponseEntity<CommunicationDto> res = controller.pinSms(participantId, smsId, req, null, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().isPinned()).isTrue();
    }

    @Test
    void handleSmsWebhook_validSignatureUpdatesStatus() {
        Map<String, String> params = Map.of("MessageSid", "SM12345", "MessageStatus", "delivered");
        when(workflowService.validateTwilioWebhookSignature(eq("valid-sig"), any(), eq(params))).thenReturn(true);
        when(workflowService.updateSmsStatusByExternalMessageId("SM12345", "delivered")).thenReturn(true);

        ResponseEntity<Void> res = controller.handleSmsWebhook("valid-sig", params, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(workflowService).updateSmsStatusByExternalMessageId("SM12345", "delivered");
    }

    @Test
    void handleSmsWebhook_invalidSignatureForbidden() {
        Map<String, String> params = Map.of("MessageSid", "SM12345", "MessageStatus", "delivered");
        when(workflowService.validateTwilioWebhookSignature(eq("bad-sig"), any(), eq(params))).thenReturn(false);

        ResponseEntity<Void> res = controller.handleSmsWebhook("bad-sig", params, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(workflowService, never()).updateSmsStatusByExternalMessageId(any(), any());
    }

    @Test
    void handleSmsWebhook_blankSidBadRequest() {
        Map<String, String> params = Map.of("MessageSid", "", "MessageStatus", "delivered");
        ResponseEntity<Void> res = controller.handleSmsWebhook(null, params, null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
