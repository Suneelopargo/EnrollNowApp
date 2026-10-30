package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantConsentLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantConsentLogControllerTest {

    @Mock private ParticipantConsentLogService consentLogService;
    @Mock private SiteAuthorizationService siteAuthorizationService;

    private ParticipantConsentLogController controller;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID participantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID userId = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private final UUID logId = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @BeforeEach
    void setUp() {
        controller = new ParticipantConsentLogController(consentLogService, siteAuthorizationService);
    }

    @Test
    void getConsentLogs_authorizedCaller_returnsConsentLogs() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        ParticipantConsentLogDto logDto = new ParticipantConsentLogDto();
        logDto.setId(logId);
        logDto.setConsentType("Initial Consent");
        logDto.setConsentTitle("Informed Consent Form");

        when(consentLogService.getConsentLogs(eq(tenantId), eq(participantId), any(), eq(userId)))
                .thenReturn(List.of(logDto));

        ResponseEntity<List<ParticipantConsentLogDto>> response =
                controller.getConsentLogs(participantId, null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(siteAuthorizationService).requireRegistryAccess(tenantId, null);
    }

    @Test
    void getConsentLogs_crossTenantMismatch_throwsAccessDenied() {
        UUID otherTenant = UUID.randomUUID();
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        assertThrows(AccessDeniedException.class, () ->
                controller.getConsentLogs(participantId, otherTenant, null, null)
        );
    }

    @Test
    void createConsentLogJson_validPayload_returnsCreated() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        CreateConsentLogRequest request = new CreateConsentLogRequest();
        request.setConsentTitle("Main Study Consent");
        request.setConsentType("Initial Consent");
        request.setConsentDate(OffsetDateTime.now());

        ParticipantConsentLogDto createdDto = new ParticipantConsentLogDto();
        createdDto.setId(logId);
        createdDto.setConsentTitle("Main Study Consent");

        when(consentLogService.createConsentLog(eq(tenantId), eq(participantId), eq(userId), eq(request), any()))
                .thenReturn(createdDto);

        ResponseEntity<ParticipantConsentLogDto> response =
                controller.createConsentLogJson(participantId, null, null, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getConsentTitle()).isEqualTo("Main Study Consent");
    }

    @Test
    void updateConsentLogJson_validPayload_returnsOk() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        UpdateConsentLogRequest request = new UpdateConsentLogRequest();
        request.setConsentTitle("Updated Title");

        ParticipantConsentLogDto updatedDto = new ParticipantConsentLogDto();
        updatedDto.setId(logId);
        updatedDto.setConsentTitle("Updated Title");

        when(consentLogService.updateConsentLog(eq(tenantId), eq(participantId), eq(logId), eq(userId), eq(request), any()))
                .thenReturn(updatedDto);

        ResponseEntity<ParticipantConsentLogDto> response =
                controller.updateConsentLogJson(participantId, logId, null, null, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getConsentTitle()).isEqualTo("Updated Title");
    }

    @Test
    void pinConsentLog_togglesSticky_returnsOk() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        PinContactLogRequest request = new PinContactLogRequest();
        request.setSticky(true);

        ParticipantConsentLogDto pinnedDto = new ParticipantConsentLogDto();
        pinnedDto.setId(logId);
        pinnedDto.setSticky(true);

        when(consentLogService.pinConsentLog(eq(tenantId), eq(participantId), eq(logId), eq(userId), eq(true)))
                .thenReturn(pinnedDto);

        ResponseEntity<ParticipantConsentLogDto> response =
                controller.pinConsentLog(participantId, logId, null, null, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSticky()).isTrue();
    }

    @Test
    void deleteConsentLog_validCall_returnsNoContent() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        ResponseEntity<Void> response = controller.deleteConsentLog(participantId, logId, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(consentLogService).deleteConsentLog(tenantId, participantId, logId, userId);
    }

    @Test
    void downloadAttachment_fileAvailable_returnsFileStream() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        byte[] content = "Sample PDF content".getBytes();
        ByteArrayResource resource = new ByteArrayResource(content);
        ParticipantConsentLogService.ConsentAttachmentDownload download =
                new ParticipantConsentLogService.ConsentAttachmentDownload(resource, "consent.pdf", "application/pdf", content.length);

        when(consentLogService.getConsentAttachment(eq(tenantId), eq(participantId), eq(logId), eq(userId)))
                .thenReturn(download);

        var response = controller.downloadAttachment(participantId, logId, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("application/pdf");
        assertThat(response.getHeaders().getFirst("Content-Disposition")).contains("consent.pdf");
    }
}
