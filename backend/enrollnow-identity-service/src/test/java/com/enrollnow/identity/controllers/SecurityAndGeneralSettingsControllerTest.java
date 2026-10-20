package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.GeneralSettingsDto;
import com.enrollnow.identity.dtos.SecuritySettingsDto;
import com.enrollnow.identity.services.GeneralSettingsService;
import com.enrollnow.identity.services.SecuritySettingsService;
import com.enrollnow.identity.services.SiteAuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityAndGeneralSettingsControllerTest {

    @Mock
    private SecuritySettingsService securitySettingsService;

    @Mock
    private GeneralSettingsService generalSettingsService;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    private SecuritySettingsController securitySettingsController;
    private GeneralSettingsController generalSettingsController;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();

        securitySettingsController = new SecuritySettingsController(
                securitySettingsService,
                siteAuthorizationService
        );

        generalSettingsController = new GeneralSettingsController(
                generalSettingsService,
                siteAuthorizationService
        );
    }

    @Test
    void testSecuritySettingsController_GetWithTenantId() {
        SecuritySettingsDto dto = new SecuritySettingsDto();
        dto.setMaxFailedLoginAttempts(10);
        when(securitySettingsService.getSecuritySettings(tenantId)).thenReturn(dto);

        ResponseEntity<SecuritySettingsDto> response = securitySettingsController.getSecuritySettings(tenantId);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(10, response.getBody().getMaxFailedLoginAttempts());
        verify(securitySettingsService).getSecuritySettings(tenantId);
    }

    @Test
    void testSecuritySettingsController_GetWithoutPathTenantId_UsesCallerIdentity() {
        SecuritySettingsDto dto = new SecuritySettingsDto();
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(securitySettingsService.getSecuritySettings(tenantId)).thenReturn(dto);

        ResponseEntity<SecuritySettingsDto> response = securitySettingsController.getSecuritySettings(null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(securitySettingsService).getSecuritySettings(tenantId);
    }

    @Test
    void testSecuritySettingsController_Update() {
        SecuritySettingsDto inputDto = new SecuritySettingsDto();
        inputDto.setMaxFailedLoginAttempts(7);

        when(securitySettingsService.updateSecuritySettings(tenantId, inputDto)).thenReturn(inputDto);

        ResponseEntity<SecuritySettingsDto> response = securitySettingsController.updateSecuritySettings(tenantId, inputDto);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(7, response.getBody().getMaxFailedLoginAttempts());
        verify(securitySettingsService).updateSecuritySettings(tenantId, inputDto);
    }

    @Test
    void testSecuritySettingsController_ResetDefaults() {
        SecuritySettingsDto defaultDto = new SecuritySettingsDto();
        when(securitySettingsService.resetToDefaults(tenantId)).thenReturn(defaultDto);

        ResponseEntity<SecuritySettingsDto> response = securitySettingsController.resetToDefaults(tenantId);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(securitySettingsService).resetToDefaults(tenantId);
    }

    @Test
    void testGeneralSettingsController_Get() {
        GeneralSettingsDto dto = new GeneralSettingsDto();
        dto.setDefaultTextReply("Automated message");
        when(generalSettingsService.getGeneralSettings(tenantId)).thenReturn(dto);

        ResponseEntity<GeneralSettingsDto> response = generalSettingsController.getGeneralSettings(tenantId);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals("Automated message", response.getBody().getDefaultTextReply());
        verify(generalSettingsService).getGeneralSettings(tenantId);
    }

    @Test
    void testGeneralSettingsController_Update() {
        GeneralSettingsDto dto = new GeneralSettingsDto();
        dto.setDefaultTextReply("Updated message response");
        when(generalSettingsService.updateGeneralSettings(tenantId, dto)).thenReturn(dto);

        ResponseEntity<GeneralSettingsDto> response = generalSettingsController.updateGeneralSettings(tenantId, dto);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals("Updated message response", response.getBody().getDefaultTextReply());
        verify(generalSettingsService).updateGeneralSettings(tenantId, dto);
    }
}
