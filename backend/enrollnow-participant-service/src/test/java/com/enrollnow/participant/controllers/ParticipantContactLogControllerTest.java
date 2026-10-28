package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantContactLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
class ParticipantContactLogControllerTest {

    @Mock private ParticipantContactLogService contactLogService;
    @Mock private SiteAuthorizationService siteAuthorizationService;

    private ParticipantContactLogController controller;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID participantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID userId = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private final UUID logId = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @BeforeEach
    void setUp() {
        controller = new ParticipantContactLogController(contactLogService, siteAuthorizationService);
    }

    @Test
    void getContactLogs_authorizedCaller_returnsContactLogs() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        ParticipantContactLogDto logDto = new ParticipantContactLogDto();
        logDto.setId(logId);
        logDto.setContactType("Phone Call");
        logDto.setOutcome("Spoke to patient");

        when(contactLogService.getContactLogs(eq(tenantId), eq(participantId), any(), eq(userId)))
                .thenReturn(List.of(logDto));

        ResponseEntity<List<ParticipantContactLogDto>> response =
                controller.getContactLogs(participantId, null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(siteAuthorizationService).requireRegistryAccess(tenantId, null);
    }

    @Test
    void getContactLogs_crossTenantMismatch_throwsAccessDenied() {
        UUID otherTenant = UUID.randomUUID();
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        assertThrows(AccessDeniedException.class, () ->
                controller.getContactLogs(participantId, otherTenant, null, null)
        );
    }

    @Test
    void getContactLogs_missingCallerTenantClaim_rejectsQueryTenantId() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, null)));

        assertThrows(AccessDeniedException.class, () ->
                controller.getContactLogs(participantId, tenantId, null, null)
        );
    }

    @Test
    void createContactLog_validPayload_returnsCreated() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        CreateContactLogRequest request = new CreateContactLogRequest();
        request.setContactType("Email");
        request.setContactedBy(userId);
        request.setOutcome("Screening Completed");
        request.setDateTimeOfContact(OffsetDateTime.now());

        ParticipantContactLogDto createdDto = new ParticipantContactLogDto();
        createdDto.setId(logId);
        createdDto.setContactType("Email");

        when(contactLogService.createContactLog(eq(tenantId), eq(participantId), eq(userId), eq(request)))
                .thenReturn(createdDto);

        ResponseEntity<ParticipantContactLogDto> response =
                controller.createContactLog(participantId, null, null, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(logId);
    }

    @Test
    void pinContactLog_togglesStickyStatus() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        PinContactLogRequest request = new PinContactLogRequest(true);
        ParticipantContactLogDto pinnedDto = new ParticipantContactLogDto();
        pinnedDto.setId(logId);
        pinnedDto.setSticky(true);

        when(contactLogService.pinContactLog(tenantId, participantId, logId, userId, true))
                .thenReturn(pinnedDto);

        ResponseEntity<ParticipantContactLogDto> response =
                controller.pinContactLog(participantId, logId, null, null, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSticky()).isTrue();
    }

    @Test
    void deleteContactLog_returnsNoContent() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        ResponseEntity<Void> response = controller.deleteContactLog(participantId, logId, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(contactLogService).deleteContactLog(tenantId, participantId, logId, userId);
    }

    @Test
    void getContactOutcomes_returnsOutcomes() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        when(contactLogService.getContactOutcomes(tenantId))
                .thenReturn(List.of(new ContactOutcomeDto(UUID.randomUUID(), "Left Voicemail", true)));

        ResponseEntity<List<ContactOutcomeDto>> response = controller.getContactOutcomes(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
    }
}
