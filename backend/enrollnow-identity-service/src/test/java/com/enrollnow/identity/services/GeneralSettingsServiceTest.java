package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.GeneralSettingsDto;
import com.enrollnow.identity.models.GeneralSettings;
import com.enrollnow.identity.repositories.GeneralSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeneralSettingsServiceTest {

    @Mock
    private GeneralSettingsRepository generalSettingsRepository;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    @InjectMocks
    private GeneralSettingsService generalSettingsService;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void testGetGeneralSettings_Existing() {
        GeneralSettings existing = new GeneralSettings();
        existing.setId(UUID.randomUUID());
        existing.setTenantId(tenantId);
        existing.setDefaultTextReply("Custom automated reply text.");

        when(generalSettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(existing));

        GeneralSettingsDto dto = generalSettingsService.getGeneralSettings(tenantId);

        assertNotNull(dto);
        assertEquals("Custom automated reply text.", dto.getDefaultTextReply());
        verify(siteAuthorizationService).requireTenantMatch(tenantId);
        verify(siteAuthorizationService).requireGeneralSettingsView(tenantId);
    }

    @Test
    void testGetGeneralSettings_CreatesDefaultWhenNotFound() {
        when(generalSettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());
        when(generalSettingsRepository.save(any(GeneralSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GeneralSettingsDto dto = generalSettingsService.getGeneralSettings(tenantId);

        assertNotNull(dto);
        assertEquals(GeneralSettingsService.DEFAULT_TEXT_REPLY, dto.getDefaultTextReply());
        verify(generalSettingsRepository).save(any(GeneralSettings.class));
    }

    @Test
    void testUpdateGeneralSettings_Success() {
        GeneralSettings existing = new GeneralSettings();
        existing.setTenantId(tenantId);
        existing.setDefaultTextReply(GeneralSettingsService.DEFAULT_TEXT_REPLY);

        when(generalSettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(existing));
        when(generalSettingsRepository.save(any(GeneralSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        GeneralSettingsDto updateDto = new GeneralSettingsDto();
        updateDto.setDefaultTextReply("  Updated response template for clinical trial inquiries.  ");

        GeneralSettingsDto updated = generalSettingsService.updateGeneralSettings(tenantId, updateDto);

        assertNotNull(updated);
        assertEquals("Updated response template for clinical trial inquiries.", updated.getDefaultTextReply());
        assertEquals(userId, updated.getUpdatedBy());
        verify(siteAuthorizationService).requireGeneralSettingsManage(tenantId);
    }

    @Test
    void testUpdateGeneralSettings_BlankValidation() {
        GeneralSettingsDto blankDto = new GeneralSettingsDto();
        blankDto.setDefaultTextReply("   ");

        assertThrows(IllegalArgumentException.class, () ->
                generalSettingsService.updateGeneralSettings(tenantId, blankDto)
        );

        GeneralSettingsDto nullDto = new GeneralSettingsDto();
        nullDto.setDefaultTextReply(null);
        assertThrows(IllegalArgumentException.class, () ->
                generalSettingsService.updateGeneralSettings(tenantId, nullDto)
        );
    }

    @Test
    void testUpdateGeneralSettings_LengthValidation() {
        String longText = "A".repeat(161);
        GeneralSettingsDto longDto = new GeneralSettingsDto();
        longDto.setDefaultTextReply(longText);

        assertThrows(IllegalArgumentException.class, () ->
                generalSettingsService.updateGeneralSettings(tenantId, longDto)
        );
    }

    @Test
    void testUpdateGeneralSettings_AccessDenied() {
        doThrow(new AccessDeniedException("Access denied")).when(siteAuthorizationService).requireGeneralSettingsManage(tenantId);

        GeneralSettingsDto dto = new GeneralSettingsDto();
        dto.setDefaultTextReply("Some reply");
        assertThrows(AccessDeniedException.class, () ->
                generalSettingsService.updateGeneralSettings(tenantId, dto)
        );
    }
}
