package com.enrollnow.registry.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.services.SiteAuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistryParticipantControllerTest {

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    @Mock
    private SiteRepository siteRepository;

    @InjectMocks
    private RegistryParticipantController controller;

    private UUID tenantId;
    private UUID siteId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        siteId = UUID.fromString("21000000-0000-0000-0000-000000000001");
    }

    @Test
    void getParticipants_authorizedUser_returns200AndEnforcesRegistryAccess() {
        ResponseEntity<ApiResponse<List<Map<String, Object>>>> res = controller.getParticipants(tenantId, siteId);

        verify(siteAuthorizationService).requireRegistryAccess(tenantId, siteId);
        assertEquals(200, res.getStatusCode().value());
        assertNotNull(res.getBody());
        assertTrue(res.getBody().isSuccess());
    }

    @Test
    void getParticipants_unauthorizedUserWithNoneSitePermission_throwsAccessDenied403() {
        doThrow(new AccessDeniedException("Access denied: Registry access requires SITE_REGISTRY, SITE_MANAGER, or SITE_ADMIN role"))
                .when(siteAuthorizationService).requireRegistryAccess(tenantId, siteId);

        assertThrows(
                AccessDeniedException.class,
                () -> controller.getParticipants(tenantId, siteId)
        );
    }

    @Test
    void getSites_returnsActiveSitesForAuthenticatedTenant() {
        Site site = new Site();
        site.setId(siteId);
        site.setTenantId(tenantId);
        site.setSiteCode("DEFAULT_SITE");
        site.setName("Default Clinical Site");
        site.setActive(true);

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(UUID.randomUUID(), tenantId)));
        when(siteRepository.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(site));

        ResponseEntity<ApiResponse<List<Map<String, Object>>>> res = controller.getSites(tenantId);

        verify(siteAuthorizationService).requireTenantMatch(tenantId);
        assertEquals(200, res.getStatusCode().value());
        assertNotNull(res.getBody());
        assertEquals(1, res.getBody().getData().size());
        assertEquals(siteId, res.getBody().getData().get(0).get("id"));
        assertEquals("DEFAULT_SITE", res.getBody().getData().get(0).get("siteCode"));
    }
}
