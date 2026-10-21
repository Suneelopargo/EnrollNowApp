package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.SecuritySettingsDto;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class SecuritySettingsService {

    public static final int DEFAULT_MAX_FAILED_ATTEMPTS = 10;
    public static final boolean DEFAULT_PREVENT_CONCURRENT_SESSIONS = false;
    public static final int DEFAULT_INACTIVITY_LOGOUT_MINUTES = 30;
    public static final int DEFAULT_INACTIVITY_LOCK_DAYS = 90;
    public static final int DEFAULT_PASSWORD_EXPIRY_DAYS = 300;
    public static final int DEFAULT_PASSWORD_HISTORY_COUNT = 4;
    public static final int DEFAULT_MINIMUM_PASSWORD_LENGTH = 10;
    public static final String DEFAULT_MINIMUM_PASSWORD_STRENGTH = "MODERATE";
    public static final boolean DEFAULT_REQUIRE_DIGIT = true;
    public static final boolean DEFAULT_REQUIRE_SYMBOL = true;
    public static final boolean DEFAULT_REQUIRE_MIXED_CASE = true;

    private final SecuritySettingsRepository securitySettingsRepository;
    private final SiteAuthorizationService siteAuthorizationService;

    public SecuritySettingsService(
            SecuritySettingsRepository securitySettingsRepository,
            SiteAuthorizationService siteAuthorizationService) {
        this.securitySettingsRepository = securitySettingsRepository;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @Transactional
    public SecuritySettingsDto getSecuritySettings(UUID tenantId) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        siteAuthorizationService.requireSiteAdminAccess(tenantId, null);

        SecuritySettings settings = securitySettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> createDefaultSettings(tenantId, null));

        return toDto(settings);
    }

    @Transactional
    public SecuritySettingsDto updateSecuritySettings(UUID tenantId, SecuritySettingsDto dto) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        siteAuthorizationService.requireSecuritySettingsManage(tenantId);

        validateSettings(dto);

        SecuritySettings settings = securitySettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> createDefaultSettings(tenantId, null));

        UUID callerUserId = siteAuthorizationService.getAuthenticatedCaller()
                .map(SiteAuthorizationService.CallerIdentity::userId)
                .orElse(null);

        if (dto.getMaxFailedLoginAttempts() != null) {
            settings.setMaxFailedLoginAttempts(dto.getMaxFailedLoginAttempts());
        }
        if (dto.getPreventConcurrentSessions() != null) {
            settings.setPreventConcurrentSessions(dto.getPreventConcurrentSessions());
        }
        if (dto.getInactivityLogoutMinutes() != null) {
            settings.setInactivityLogoutMinutes(dto.getInactivityLogoutMinutes());
        }
        if (dto.getInactivityLockDays() != null) {
            settings.setInactivityLockDays(dto.getInactivityLockDays());
        }
        if (dto.getPasswordExpiryDays() != null) {
            settings.setPasswordExpiryDays(dto.getPasswordExpiryDays());
        }
        if (dto.getPasswordHistoryCount() != null) {
            settings.setPasswordHistoryCount(dto.getPasswordHistoryCount());
        }
        if (dto.getMinimumPasswordLength() != null) {
            settings.setMinimumPasswordLength(dto.getMinimumPasswordLength());
        }
        if (dto.getMinimumPasswordStrength() != null) {
            settings.setMinimumPasswordStrength(dto.getMinimumPasswordStrength().toUpperCase());
        }
        if (dto.getRequireDigit() != null) {
            settings.setRequireDigit(dto.getRequireDigit());
        }
        if (dto.getRequireSymbol() != null) {
            settings.setRequireSymbol(dto.getRequireSymbol());
        }
        if (dto.getRequireMixedCase() != null) {
            settings.setRequireMixedCase(dto.getRequireMixedCase());
        }

        settings.setUpdatedAt(OffsetDateTime.now());
        settings.setUpdatedBy(callerUserId);

        SecuritySettings saved = securitySettingsRepository.save(settings);
        return toDto(saved);
    }

    @Transactional
    public SecuritySettingsDto resetToDefaults(UUID tenantId) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        siteAuthorizationService.requireSecuritySettingsManage(tenantId);

        UUID callerUserId = siteAuthorizationService.getAuthenticatedCaller()
                .map(SiteAuthorizationService.CallerIdentity::userId)
                .orElse(null);

        SecuritySettings settings = securitySettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> new SecuritySettings());

        settings.setTenantId(tenantId);
        settings.setMaxFailedLoginAttempts(DEFAULT_MAX_FAILED_ATTEMPTS);
        settings.setPreventConcurrentSessions(DEFAULT_PREVENT_CONCURRENT_SESSIONS);
        settings.setInactivityLogoutMinutes(DEFAULT_INACTIVITY_LOGOUT_MINUTES);
        settings.setInactivityLockDays(DEFAULT_INACTIVITY_LOCK_DAYS);
        settings.setPasswordExpiryDays(DEFAULT_PASSWORD_EXPIRY_DAYS);
        settings.setPasswordHistoryCount(DEFAULT_PASSWORD_HISTORY_COUNT);
        settings.setMinimumPasswordLength(DEFAULT_MINIMUM_PASSWORD_LENGTH);
        settings.setMinimumPasswordStrength(DEFAULT_MINIMUM_PASSWORD_STRENGTH);
        settings.setRequireDigit(DEFAULT_REQUIRE_DIGIT);
        settings.setRequireSymbol(DEFAULT_REQUIRE_SYMBOL);
        settings.setRequireMixedCase(DEFAULT_REQUIRE_MIXED_CASE);
        settings.setUpdatedAt(OffsetDateTime.now());
        settings.setUpdatedBy(callerUserId);

        SecuritySettings saved = securitySettingsRepository.save(settings);
        return toDto(saved);
    }

    private void validateSettings(SecuritySettingsDto dto) {
        if (dto.getMaxFailedLoginAttempts() != null && dto.getMaxFailedLoginAttempts() < 1) {
            throw new IllegalArgumentException("Max failed login attempts must be at least 1");
        }
        if (dto.getInactivityLogoutMinutes() != null && dto.getInactivityLogoutMinutes() < 1) {
            throw new IllegalArgumentException("Inactivity logout minutes must be at least 1");
        }
        if (dto.getInactivityLockDays() != null && dto.getInactivityLockDays() < 1) {
            throw new IllegalArgumentException("Inactivity lock days must be at least 1");
        }
        if (dto.getPasswordExpiryDays() != null && dto.getPasswordExpiryDays() < 1) {
            throw new IllegalArgumentException("Password expiry days must be at least 1");
        }
        if (dto.getPasswordHistoryCount() != null && dto.getPasswordHistoryCount() < 0) {
            throw new IllegalArgumentException("Password history count cannot be negative");
        }
        if (dto.getMinimumPasswordLength() != null && dto.getMinimumPasswordLength() < 8) {
            throw new IllegalArgumentException("Minimum password length must be at least 8");
        }
    }

    private SecuritySettings createDefaultSettings(UUID tenantId, UUID creatorUserId) {
        SecuritySettings settings = new SecuritySettings();
        settings.setTenantId(tenantId);
        settings.setMaxFailedLoginAttempts(DEFAULT_MAX_FAILED_ATTEMPTS);
        settings.setPreventConcurrentSessions(DEFAULT_PREVENT_CONCURRENT_SESSIONS);
        settings.setInactivityLogoutMinutes(DEFAULT_INACTIVITY_LOGOUT_MINUTES);
        settings.setInactivityLockDays(DEFAULT_INACTIVITY_LOCK_DAYS);
        settings.setPasswordExpiryDays(DEFAULT_PASSWORD_EXPIRY_DAYS);
        settings.setPasswordHistoryCount(DEFAULT_PASSWORD_HISTORY_COUNT);
        settings.setMinimumPasswordLength(DEFAULT_MINIMUM_PASSWORD_LENGTH);
        settings.setMinimumPasswordStrength(DEFAULT_MINIMUM_PASSWORD_STRENGTH);
        settings.setRequireDigit(DEFAULT_REQUIRE_DIGIT);
        settings.setRequireSymbol(DEFAULT_REQUIRE_SYMBOL);
        settings.setRequireMixedCase(DEFAULT_REQUIRE_MIXED_CASE);
        settings.setCreatedBy(creatorUserId);
        settings.setUpdatedBy(creatorUserId);
        return securitySettingsRepository.save(settings);
    }

    private SecuritySettingsDto toDto(SecuritySettings entity) {
        SecuritySettingsDto dto = new SecuritySettingsDto();
        dto.setId(entity.getId());
        dto.setTenantId(entity.getTenantId());
        dto.setMaxFailedLoginAttempts(entity.getMaxFailedLoginAttempts());
        dto.setPreventConcurrentSessions(entity.isPreventConcurrentSessions());
        dto.setInactivityLogoutMinutes(entity.getInactivityLogoutMinutes());
        dto.setInactivityLockDays(entity.getInactivityLockDays());
        dto.setPasswordExpiryDays(entity.getPasswordExpiryDays());
        dto.setPasswordHistoryCount(entity.getPasswordHistoryCount());
        dto.setMinimumPasswordLength(entity.getMinimumPasswordLength());
        dto.setMinimumPasswordStrength(entity.getMinimumPasswordStrength());
        dto.setRequireDigit(entity.isRequireDigit());
        dto.setRequireSymbol(entity.isRequireSymbol());
        dto.setRequireMixedCase(entity.isRequireMixedCase());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setUpdatedBy(entity.getUpdatedBy());
        return dto;
    }
}
