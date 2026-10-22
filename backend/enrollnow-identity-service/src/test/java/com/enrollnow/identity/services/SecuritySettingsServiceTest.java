package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.PasswordPolicyDto;
import com.enrollnow.identity.dtos.SecuritySettingsDto;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
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
class SecuritySettingsServiceTest {

    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    @InjectMocks
    private SecuritySettingsService securitySettingsService;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void testGetSecuritySettings_Existing() {
        SecuritySettings existing = new SecuritySettings();
        existing.setId(UUID.randomUUID());
        existing.setTenantId(tenantId);
        existing.setMaxFailedLoginAttempts(7);
        existing.setPreventConcurrentSessions(true);
        existing.setInactivityLogoutMinutes(15);
        existing.setInactivityLockDays(60);
        existing.setPasswordExpiryDays(180);
        existing.setPasswordHistoryCount(5);
        existing.setMinimumPasswordLength(12);
        existing.setMinimumPasswordStrength("STRONG");
        existing.setRequireDigit(true);
        existing.setRequireSymbol(true);
        existing.setRequireMixedCase(true);

        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(existing));

        SecuritySettingsDto result = securitySettingsService.getSecuritySettings(tenantId);

        assertNotNull(result);
        assertEquals(7, result.getMaxFailedLoginAttempts());
        assertTrue(result.getPreventConcurrentSessions());
        assertEquals(15, result.getInactivityLogoutMinutes());
        assertEquals(60, result.getInactivityLockDays());
        assertEquals(180, result.getPasswordExpiryDays());
        assertEquals(5, result.getPasswordHistoryCount());
        assertEquals(12, result.getMinimumPasswordLength());
        assertEquals("STRONG", result.getMinimumPasswordStrength());
        verify(siteAuthorizationService).requireTenantMatch(tenantId);
        verify(siteAuthorizationService).requireSiteAdminAccess(tenantId, null);
    }

    @Test
    void testGetSecuritySettings_CreatesDefaultWhenNotFound() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecuritySettingsDto result = securitySettingsService.getSecuritySettings(tenantId);

        assertNotNull(result);
        assertEquals(SecuritySettingsService.DEFAULT_MAX_FAILED_ATTEMPTS, result.getMaxFailedLoginAttempts());
        assertEquals(SecuritySettingsService.DEFAULT_INACTIVITY_LOGOUT_MINUTES, result.getInactivityLogoutMinutes());
        assertEquals(SecuritySettingsService.DEFAULT_INACTIVITY_LOCK_DAYS, result.getInactivityLockDays());
        assertEquals(SecuritySettingsService.DEFAULT_PASSWORD_EXPIRY_DAYS, result.getPasswordExpiryDays());
        assertEquals(SecuritySettingsService.DEFAULT_PASSWORD_HISTORY_COUNT, result.getPasswordHistoryCount());
        assertEquals(SecuritySettingsService.DEFAULT_MINIMUM_PASSWORD_LENGTH, result.getMinimumPasswordLength());
        assertEquals(SecuritySettingsService.DEFAULT_MINIMUM_PASSWORD_STRENGTH, result.getMinimumPasswordStrength());
        verify(securitySettingsRepository).save(any(SecuritySettings.class));
    }

    @Test
    void testUpdateSecuritySettings_Success() {
        SecuritySettings existing = new SecuritySettings();
        existing.setTenantId(tenantId);
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(existing));
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));

        SecuritySettingsDto updateDto = new SecuritySettingsDto();
        updateDto.setMaxFailedLoginAttempts(8);
        updateDto.setPreventConcurrentSessions(true);
        updateDto.setInactivityLogoutMinutes(20);
        updateDto.setInactivityLockDays(45);
        updateDto.setPasswordExpiryDays(90);
        updateDto.setPasswordHistoryCount(3);
        updateDto.setMinimumPasswordLength(14);
        updateDto.setMinimumPasswordStrength("STRONG");
        updateDto.setRequireDigit(true);
        updateDto.setRequireSymbol(false);
        updateDto.setRequireMixedCase(true);

        SecuritySettingsDto updated = securitySettingsService.updateSecuritySettings(tenantId, updateDto);

        assertNotNull(updated);
        assertEquals(8, updated.getMaxFailedLoginAttempts());
        assertTrue(updated.getPreventConcurrentSessions());
        assertEquals(20, updated.getInactivityLogoutMinutes());
        assertEquals(45, updated.getInactivityLockDays());
        assertEquals(90, updated.getPasswordExpiryDays());
        assertEquals(3, updated.getPasswordHistoryCount());
        assertEquals(14, updated.getMinimumPasswordLength());
        assertEquals("STRONG", updated.getMinimumPasswordStrength());
        assertFalse(updated.getRequireSymbol());
        assertEquals(userId, updated.getUpdatedBy());
        verify(siteAuthorizationService).requireSecuritySettingsManage(tenantId);
    }

    @Test
    void testUpdateSecuritySettings_ValidationFailures() {
        SecuritySettingsDto invalidDto = new SecuritySettingsDto();
        invalidDto.setMinimumPasswordLength(5); // Below min 8

        assertThrows(IllegalArgumentException.class, () ->
                securitySettingsService.updateSecuritySettings(tenantId, invalidDto)
        );

        invalidDto.setMinimumPasswordLength(10);
        invalidDto.setMaxFailedLoginAttempts(0); // Min 1
        assertThrows(IllegalArgumentException.class, () ->
                securitySettingsService.updateSecuritySettings(tenantId, invalidDto)
        );

        invalidDto.setMaxFailedLoginAttempts(5);
        invalidDto.setPasswordHistoryCount(-1); // Cannot be negative
        assertThrows(IllegalArgumentException.class, () ->
                securitySettingsService.updateSecuritySettings(tenantId, invalidDto)
        );
    }

    @Test
    void testResetToDefaults_Success() {
        SecuritySettings existing = new SecuritySettings();
        existing.setTenantId(tenantId);
        existing.setMaxFailedLoginAttempts(3);
        existing.setMinimumPasswordLength(16);

        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(existing));
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecuritySettingsDto reset = securitySettingsService.resetToDefaults(tenantId);

        assertNotNull(reset);
        assertEquals(SecuritySettingsService.DEFAULT_MAX_FAILED_ATTEMPTS, reset.getMaxFailedLoginAttempts());
        assertEquals(SecuritySettingsService.DEFAULT_INACTIVITY_LOGOUT_MINUTES, reset.getInactivityLogoutMinutes());
        assertEquals(SecuritySettingsService.DEFAULT_INACTIVITY_LOCK_DAYS, reset.getInactivityLockDays());
        assertEquals(SecuritySettingsService.DEFAULT_PASSWORD_EXPIRY_DAYS, reset.getPasswordExpiryDays());
        assertEquals(SecuritySettingsService.DEFAULT_MINIMUM_PASSWORD_LENGTH, reset.getMinimumPasswordLength());
        assertEquals(SecuritySettingsService.DEFAULT_MINIMUM_PASSWORD_STRENGTH, reset.getMinimumPasswordStrength());
        verify(siteAuthorizationService).requireSecuritySettingsManage(tenantId);
    }

    @Test
    void testUpdateSecuritySettings_AccessDenied() {
        doThrow(new AccessDeniedException("Access denied")).when(siteAuthorizationService).requireSecuritySettingsManage(tenantId);

        SecuritySettingsDto dto = new SecuritySettingsDto();
        assertThrows(AccessDeniedException.class, () ->
                securitySettingsService.updateSecuritySettings(tenantId, dto)
        );
    }

    @Test
    void testGetPublicPasswordPolicy_ReturnsConfiguredSettings() {
        SecuritySettings existing = new SecuritySettings();
        existing.setTenantId(tenantId);
        existing.setMinimumPasswordLength(14);
        existing.setMinimumPasswordStrength("STRONG");
        existing.setRequireDigit(true);
        existing.setRequireSymbol(false);
        existing.setRequireMixedCase(true);

        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(existing));

        PasswordPolicyDto policy = securitySettingsService.getPublicPasswordPolicy(tenantId);

        assertNotNull(policy);
        assertEquals(14, policy.getMinimumPasswordLength());
        assertEquals("STRONG", policy.getMinimumPasswordStrength());
        assertTrue(policy.getRequireDigit());
        assertFalse(policy.getRequireSymbol());
        assertTrue(policy.getRequireMixedCase());
        verify(siteAuthorizationService, never()).requireSiteAdminAccess(any(), any());
    }

    @Test
    void testGetPublicPasswordPolicy_ReturnsDefaultsWhenNotFound() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());

        PasswordPolicyDto policy = securitySettingsService.getPublicPasswordPolicy(tenantId);

        assertNotNull(policy);
        assertEquals(SecuritySettingsService.DEFAULT_MINIMUM_PASSWORD_LENGTH, policy.getMinimumPasswordLength());
        assertEquals(SecuritySettingsService.DEFAULT_MINIMUM_PASSWORD_STRENGTH, policy.getMinimumPasswordStrength());
        assertTrue(policy.getRequireDigit());
        assertTrue(policy.getRequireSymbol());
        assertTrue(policy.getRequireMixedCase());
    }
}
