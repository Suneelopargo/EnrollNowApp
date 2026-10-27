package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantRegistryService;
import com.enrollnow.participant.services.RegistryExportService;
import com.enrollnow.participant.services.RegistrySavedSearchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantRegistryControllerTest {

    @Mock private ParticipantRegistryService registryService;
    @Mock private RegistrySavedSearchService savedSearchService;
    @Mock private RegistryExportService exportService;
    @Mock private SiteAuthorizationService siteAuthorizationService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ParticipantRegistryController controller;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID userId = UUID.fromString("4e1941de-e712-4fe0-b0ea-845094e86349");

    @BeforeEach
    void setUp() {
        controller = new ParticipantRegistryController(
                registryService,
                savedSearchService,
                exportService,
                siteAuthorizationService,
                objectMapper
        );
    }

    @Test
    void getParticipants_callsRegistryServiceAndReturnsOk() {
        RegistryParticipantDto p = new RegistryParticipantDto();
        p.setId(UUID.randomUUID().toString());
        p.setName("John Doe");

        RegistryPagedResponse<RegistryParticipantDto> pagedResponse =
                new RegistryPagedResponse<>(List.of(p), 1, 0, 25);

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.searchParticipants(eq(tenantId), any(), any(), any(), any(), any(), any(), anyBoolean(), eq(0), eq(25), any(), any()))
                .thenReturn(pagedResponse);

        ResponseEntity<RegistryPagedResponse<RegistryParticipantDto>> response =
                controller.getParticipants(null, null, "John", null, "all", "all", null, null, 0, 25, "name", "asc");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getItems()).hasSize(1);
        verify(siteAuthorizationService).requireRegistryAccess(tenantId, null);
    }

    @Test
    void getParticipants_parsesCustomFiltersJsonWithRangeAndMultiSelect() {
        RegistryPagedResponse<RegistryParticipantDto> pagedResponse =
                new RegistryPagedResponse<>(Collections.emptyList(), 0, 0, 25);

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.searchParticipants(eq(tenantId), any(), any(), any(), any(), any(), any(), anyBoolean(), eq(0), eq(25), any(), any()))
                .thenReturn(pagedResponse);

        String json = "[{\"id\":\"1\",\"field\":\"age\",\"operator\":\"between\",\"minValue\":\"20\",\"maxValue\":\"40\"}," +
                "{\"id\":\"2\",\"field\":\"gender\",\"operator\":\"equal to\",\"values\":[\"Male\",\"Female\"]}]";

        ResponseEntity<RegistryPagedResponse<RegistryParticipantDto>> response =
                controller.getParticipants(null, null, null, null, "all", "all", null, json, 0, 25, "name", "asc");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(registryService).searchParticipants(
                eq(tenantId), isNull(), isNull(), eq("all"), eq("all"), isNull(),
                argThat(rules -> rules.size() == 2 &&
                        "age".equals(rules.get(0).getField()) &&
                        "20".equals(rules.get(0).getMinValue()) &&
                        rules.get(1).getValues().contains("Male")),
                eq(false),
                eq(0), eq(25), eq("name"), eq("asc")
        );
    }

    @Test
    void getParticipant_returnsOkWhenFound() {
        UUID partId = UUID.randomUUID();
        RegistryParticipantDto p = new RegistryParticipantDto();
        p.setId(partId.toString());
        p.setName("Jane Doe");

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.getParticipantById(tenantId, partId)).thenReturn(Optional.of(p));

        ResponseEntity<RegistryParticipantDto> response = controller.getParticipant(partId, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Jane Doe");
    }

    @Test
    void createParticipant_returnsCreated() {
        CreateParticipantRequest request = new CreateParticipantRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");

        RegistryParticipantDto created = new RegistryParticipantDto();
        created.setId(UUID.randomUUID().toString());
        created.setName("Jane Doe");

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.createParticipant(eq(tenantId), any(), eq(userId), any())).thenReturn(created);

        ResponseEntity<RegistryParticipantDto> response = controller.createParticipant(null, null, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Jane Doe");
    }

    @Test
    void exportRegistry_returnsCsvAttachment() {
        byte[] csv = "Participant ID,Name\n1,Jane".getBytes();
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.getAllMatchingParticipants(eq(tenantId), any(), any(), any(), any(), any(), any(), anyBoolean()))
                .thenReturn(Collections.emptyList());
        when(exportService.exportToCsv(any())).thenReturn(csv);

        ResponseEntity<byte[]> response = controller.exportRegistry(null, null, null, null, "all", "all", null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst("Content-Disposition")).contains("registry_export_");
        assertThat(response.getBody()).isEqualTo(csv);
    }

    @Test
    void getParticipants_withDuplicatesOnly_delegatesToService() {
        RegistryPagedResponse<RegistryParticipantDto> pagedResponse =
                new RegistryPagedResponse<>(Collections.emptyList(), 0, 0, 25);

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.searchParticipants(eq(tenantId), any(), any(), any(), any(), any(), any(), eq(true), eq(0), eq(25), any(), any()))
                .thenReturn(pagedResponse);

        ResponseEntity<RegistryPagedResponse<RegistryParticipantDto>> response =
                controller.getParticipants(null, null, null, null, "all", "all", null, null, true, 0, 25, "name", "asc");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(registryService).searchParticipants(eq(tenantId), isNull(), isNull(), eq("all"), eq("all"), isNull(), any(), eq(true), eq(0), eq(25), eq("name"), eq("asc"));
    }

    @Test
    void getParticipants_rejectsUnauthorizedCrossTenantAccess() {
        UUID otherTenantId = UUID.randomUUID();
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        assertThrows(AccessDeniedException.class, () ->
                controller.getParticipants(otherTenantId, null, null, null, "all", "all", null, null, 0, 25, "name", "asc")
        );

        verify(registryService, never()).searchParticipants(any(), any(), any(), any(), any(), any(), any(), anyBoolean(), anyInt(), anyInt(), any(), any());
    }

    @Test
    void getParticipants_rejectsUnauthenticatedAccess() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.empty());

        assertThrows(org.springframework.security.authentication.InsufficientAuthenticationException.class, () ->
                controller.getParticipants(null, null, null, null, "all", "all", null, null, 0, 25, "name", "asc")
        );

        verify(registryService, never()).searchParticipants(any(), any(), any(), any(), any(), any(), any(), anyBoolean(), anyInt(), anyInt(), any(), any());
    }

    @Test
    void getParticipants_rejectsMalformedCustomFiltersJson() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        assertThrows(org.springframework.web.server.ResponseStatusException.class, () ->
                controller.getParticipants(null, null, null, null, "all", "all", null, "{invalid-json", 0, 25, "name", "asc")
        );
    }

    @Test
    void getParticipants_rejectsUnauthorizedSiteRegistryAccess() {
        UUID unauthorizedSiteId = UUID.randomUUID();
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        doThrow(new AccessDeniedException("Access denied: Registry access requires SITE_REGISTRY, SITE_MANAGER, or SITE_ADMIN role"))
                .when(siteAuthorizationService).requireRegistryAccess(tenantId, unauthorizedSiteId);

        assertThrows(AccessDeniedException.class, () ->
                controller.getParticipants(tenantId, unauthorizedSiteId, null, null, "all", "all", null, null, 0, 25, "name", "asc")
        );

        verify(registryService, never()).searchParticipants(any(), any(), any(), any(), any(), any(), any(), anyBoolean(), anyInt(), anyInt(), any(), any());
    }

    @Test
    void createParticipant_rejectsUnauthorizedSiteRegistryAccess() {
        UUID unauthorizedSiteId = UUID.randomUUID();
        CreateParticipantRequest request = new CreateParticipantRequest();
        request.setFirstName("Unauthorized");
        request.setLastName("User");

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        doThrow(new AccessDeniedException("Access denied: Registry access requires SITE_REGISTRY, SITE_MANAGER, or SITE_ADMIN role"))
                .when(siteAuthorizationService).requireRegistryAccess(tenantId, unauthorizedSiteId);

        assertThrows(AccessDeniedException.class, () ->
                controller.createParticipant(tenantId, unauthorizedSiteId, request)
        );

        verify(registryService, never()).createParticipant(any(), any(), any(), any());
    }

    @Test
    void checkDuplicate_returnsDuplicatesList() {
        RegistryParticipantDto p = new RegistryParticipantDto();
        p.setId(UUID.randomUUID().toString());
        p.setFirstName("Alice");
        p.setLastName("Walker");

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.findDuplicatesByName(tenantId, "Alice", "Walker"))
                .thenReturn(List.of(p));

        ResponseEntity<List<RegistryParticipantDto>> response =
                controller.checkDuplicate("Alice", "Walker", tenantId, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getFirstName()).isEqualTo("Alice");
        verify(registryService).findDuplicatesByName(tenantId, "Alice", "Walker");
    }

    @Test
    void exportRegistry_rejectsUnauthorizedAccess() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        doThrow(new AccessDeniedException("Access denied: Registry access requires SITE_REGISTRY, SITE_MANAGER, or SITE_ADMIN role"))
                .when(siteAuthorizationService).requireRegistryAccess(tenantId, null);

        assertThrows(AccessDeniedException.class, () ->
                controller.exportRegistry(tenantId, null, null, null, "all", "all", null, null)
        );

        verify(exportService, never()).exportToCsv(any());
    }

    @Test
    void savedSearches_rejectsUnauthorizedAccess() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        doThrow(new AccessDeniedException("Access denied: Registry access requires SITE_REGISTRY, SITE_MANAGER, or SITE_ADMIN role"))
                .when(siteAuthorizationService).requireRegistryAccess(tenantId, null);

        assertThrows(AccessDeniedException.class, () ->
                controller.getSavedSearches(tenantId)
        );

        verify(savedSearchService, never()).getSavedSearches(any(), any());
    }

    @Test
    void getParticipantTags_returnsTagsList_whenAuthorized() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(registryService.getParticipantTags(tenantId, null, "AD", 20))
                .thenReturn(List.of("ADRC", "Adult"));

        ResponseEntity<List<String>> response = controller.getParticipantTags("AD", 20, tenantId, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactly("ADRC", "Adult");
        verify(siteAuthorizationService).requireRegistryAccess(tenantId, null);
        verify(registryService).getParticipantTags(tenantId, null, "AD", 20);
    }

    @Test
    void getParticipantTags_rejectsUnauthorizedAccess() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        doThrow(new AccessDeniedException("Access denied"))
                .when(siteAuthorizationService).requireRegistryAccess(tenantId, null);

        assertThrows(AccessDeniedException.class, () ->
                controller.getParticipantTags("AD", 20, tenantId, null)
        );

        verify(registryService, never()).getParticipantTags(any(), any(), any(), anyInt());
    }
}
