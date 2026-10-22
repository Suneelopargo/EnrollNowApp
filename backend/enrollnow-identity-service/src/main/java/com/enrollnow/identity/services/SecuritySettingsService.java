package com.enrollnow.identity.services;

import com.enrollnow.common.security.SecurityTokenHelper;
import com.enrollnow.identity.dtos.ForceResetResultDto;
import com.enrollnow.identity.dtos.PasswordPolicyDto;
import com.enrollnow.identity.dtos.SecuritySettingsDto;
import com.enrollnow.identity.models.*;
import com.enrollnow.identity.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SecuritySettingsService {

    private static final Logger log = LoggerFactory.getLogger(SecuritySettingsService.class);

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
    private UserRepository userRepository;
    private UserEmailRepository userEmailRepository;
    private UserSecurityStateRepository userSecurityStateRepository;
    private UserSessionService userSessionService;
    private UserActionTokenRepository userActionTokenRepository;
    private InvitationEmailService invitationEmailService;
    private AuditEventRepository auditEventRepository;

    public SecuritySettingsService(
            SecuritySettingsRepository securitySettingsRepository,
            SiteAuthorizationService siteAuthorizationService) {
        this.securitySettingsRepository = securitySettingsRepository;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @Autowired
    public SecuritySettingsService(
            SecuritySettingsRepository securitySettingsRepository,
            SiteAuthorizationService siteAuthorizationService,
            @Autowired(required = false) UserRepository userRepository,
            @Autowired(required = false) UserEmailRepository userEmailRepository,
            @Autowired(required = false) UserSecurityStateRepository userSecurityStateRepository,
            @Autowired(required = false) UserSessionService userSessionService,
            @Autowired(required = false) UserActionTokenRepository userActionTokenRepository,
            @Autowired(required = false) InvitationEmailService invitationEmailService,
            @Autowired(required = false) AuditEventRepository auditEventRepository) {
        this.securitySettingsRepository = securitySettingsRepository;
        this.siteAuthorizationService = siteAuthorizationService;
        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
        this.userSessionService = userSessionService;
        this.userActionTokenRepository = userActionTokenRepository;
        this.invitationEmailService = invitationEmailService;
        this.auditEventRepository = auditEventRepository;
    }

    @Autowired(required = false)
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired(required = false)
    public void setUserEmailRepository(UserEmailRepository userEmailRepository) {
        this.userEmailRepository = userEmailRepository;
    }

    @Autowired(required = false)
    public void setUserSecurityStateRepository(UserSecurityStateRepository userSecurityStateRepository) {
        this.userSecurityStateRepository = userSecurityStateRepository;
    }

    @Autowired(required = false)
    public void setUserSessionService(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    @Autowired(required = false)
    public void setUserActionTokenRepository(UserActionTokenRepository userActionTokenRepository) {
        this.userActionTokenRepository = userActionTokenRepository;
    }

    @Autowired(required = false)
    public void setInvitationEmailService(InvitationEmailService invitationEmailService) {
        this.invitationEmailService = invitationEmailService;
    }

    @Autowired(required = false)
    public void setAuditEventRepository(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @Transactional
    public SecuritySettingsDto getSecuritySettings(UUID tenantId) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        siteAuthorizationService.requireSiteAdminAccess(tenantId, null);

        SecuritySettings settings = securitySettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> createDefaultSettings(tenantId, null));

        return toDto(settings);
    }

    @Transactional(readOnly = true)
    public PasswordPolicyDto getPublicPasswordPolicy(UUID tenantId) {
        return getPublicPasswordPolicy(tenantId, null);
    }

    @Transactional(readOnly = true)
    public PasswordPolicyDto getPublicPasswordPolicy(UUID tenantId, String token) {
        UUID effectiveTenantId = tenantId;
        if (effectiveTenantId == null && token != null && !token.isBlank() && userActionTokenRepository != null) {
            String tokenHash = SecurityTokenHelper.hashToken(token.trim());
            UserActionToken actionToken = userActionTokenRepository.findByTokenHash(tokenHash).orElse(null);
            if (actionToken != null) {
                effectiveTenantId = actionToken.getTenantId();
            }
        }

        SecuritySettings settings = null;
        if (effectiveTenantId != null) {
            settings = securitySettingsRepository.findByTenantId(effectiveTenantId).orElse(null);
        }

        int minLength = (settings != null && settings.getMinimumPasswordLength() != null)
                ? settings.getMinimumPasswordLength()
                : DEFAULT_MINIMUM_PASSWORD_LENGTH;
        String minStrength = (settings != null && settings.getMinimumPasswordStrength() != null)
                ? settings.getMinimumPasswordStrength()
                : DEFAULT_MINIMUM_PASSWORD_STRENGTH;
        boolean requireDigit = settings == null || settings.isRequireDigit();
        boolean requireSymbol = settings == null || settings.isRequireSymbol();
        boolean requireMixedCase = settings == null || settings.isRequireMixedCase();

        return new PasswordPolicyDto(
                minLength,
                minStrength,
                requireDigit,
                requireSymbol,
                requireMixedCase
        );
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
    public ForceResetResultDto forcePasswordReset(UUID tenantId) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        siteAuthorizationService.requireSecuritySettingsManage(tenantId);

        UUID callerUserId = siteAuthorizationService.getAuthenticatedCaller()
                .map(SiteAuthorizationService.CallerIdentity::userId)
                .orElse(null);

        if (userRepository == null || userSecurityStateRepository == null) {
            throw new IllegalStateException("User repository not configured for force reset");
        }

        List<User> users = userRepository.findByTenantId(tenantId);
        List<User> eligibleUsers = users.stream()
                .filter(u -> !"DISABLED".equalsIgnoreCase(u.getStatus()))
                .toList();

        OffsetDateTime now = OffsetDateTime.now();
        int emailsSent = 0;
        int emailsFailed = 0;

        for (User user : eligibleUsers) {
            UserSecurityState state = userSecurityStateRepository
                    .findByTenantIdAndUserId(tenantId, user.getId())
                    .orElseGet(() -> {
                        UserSecurityState ns = new UserSecurityState();
                        ns.setTenantId(tenantId);
                        ns.setUserId(user.getId());
                        ns.setFailedLoginAttempts(0);
                        return ns;
                    });

            state.setPasswordResetRequired(true);
            state.setLockedAt(now);
            state.setLockReason("PASSWORD_RESET_REQUIRED");
            userSecurityStateRepository.save(state);

            // Invalidate current sessions
            if (userSessionService != null) {
                userSessionService.revokeExistingSessions(tenantId, user.getId(), "PASSWORD_RESET_REQUIRED");
            }

            // Generate reset token and email
            if (userActionTokenRepository != null && invitationEmailService != null && userEmailRepository != null) {
                try {
                    List<UserActionToken> existing = userActionTokenRepository
                            .findByTenantIdAndUserIdAndTokenTypeAndUsedAtIsNull(tenantId, user.getId(), "PASSWORD_RESET");
                    for (UserActionToken t : existing) {
                        t.setUsedAt(now);
                        userActionTokenRepository.save(t);
                    }

                    String rawToken = SecurityTokenHelper.generateSecureToken();
                    UserActionToken resetToken = new UserActionToken();
                    resetToken.setTenantId(tenantId);
                    resetToken.setUserId(user.getId());
                    resetToken.setTokenType("PASSWORD_RESET");
                    resetToken.setTokenHash(SecurityTokenHelper.hashToken(rawToken));
                    resetToken.setExpiresAt(now.plusMinutes(30));
                    userActionTokenRepository.save(resetToken);

                    UserEmail primaryEmail = userEmailRepository
                            .findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, user.getId())
                            .orElse(null);

                    if (primaryEmail != null) {
                        String recipientName = (user.getFirstName() != null ? user.getFirstName() : "")
                                + " " + (user.getLastName() != null ? user.getLastName() : "");
                        recipientName = recipientName.trim().isEmpty() ? "EnrollNow User" : recipientName.trim();

                        invitationEmailService.sendPasswordReset(
                                primaryEmail.getEmail(),
                                recipientName,
                                tenantId.toString(),
                                rawToken
                        );
                        emailsSent++;
                    }
                } catch (Exception ex) {
                    log.error("Failed to generate or send force reset email to user {}: {}", user.getId(), ex.getMessage(), ex);
                    emailsFailed++;
                }
            }
        }

        // Record audit event
        if (auditEventRepository != null) {
            try {
                AuditEvent audit = new AuditEvent();
                audit.setTenantId(tenantId);
                audit.setActorUserId(callerUserId);
                audit.setEntityType("SECURITY_SETTINGS");
                audit.setEntityId(tenantId);
                audit.setAction("FORCE_RESET_ALL_PASSWORDS");
                audit.setDescription("Administrator forced password reset for " + eligibleUsers.size() + " users in tenant");
                audit.setSource("APPLICATION");
                auditEventRepository.save(audit);
            } catch (Exception ex) {
                log.warn("Failed to record audit event for force reset: {}", ex.getMessage());
            }
        }

        String msg = "Successfully forced password reset for " + eligibleUsers.size() + " users.";
        return new ForceResetResultDto(eligibleUsers.size(), emailsSent, emailsFailed, msg);
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
