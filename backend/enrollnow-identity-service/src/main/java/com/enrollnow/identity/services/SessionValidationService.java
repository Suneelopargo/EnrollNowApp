package com.enrollnow.identity.services;

import com.enrollnow.common.security.SecurityTokenHelper;
import com.enrollnow.identity.exceptions.SessionRevokedException;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.models.UserSession;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import com.enrollnow.identity.repositories.UserSessionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class SessionValidationService {

    private final UserSessionRepository userSessionRepository;
    private final SecuritySettingsRepository securitySettingsRepository;
    private UserSecurityStateRepository userSecurityStateRepository;

    public SessionValidationService(
            UserSessionRepository userSessionRepository,
            SecuritySettingsRepository securitySettingsRepository) {

        this(userSessionRepository, securitySettingsRepository, null);
    }

    @Autowired
    public SessionValidationService(
            UserSessionRepository userSessionRepository,
            SecuritySettingsRepository securitySettingsRepository,
            @Autowired(required = false) UserSecurityStateRepository userSecurityStateRepository) {

        this.userSessionRepository = userSessionRepository;
        this.securitySettingsRepository = securitySettingsRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
    }

    @Autowired(required = false)
    public void setUserSecurityStateRepository(UserSecurityStateRepository userSecurityStateRepository) {
        this.userSecurityStateRepository = userSecurityStateRepository;
    }

    @Transactional(noRollbackFor = {IllegalStateException.class, SessionRevokedException.class})
    public void validateAndTouch(
            String rawAccessToken,
            UUID tenantId,
            UUID userId) {

        validateSession(rawAccessToken, tenantId, userId, true);
    }

    @Transactional(noRollbackFor = {IllegalStateException.class, SessionRevokedException.class})
    public void validateSession(
            String rawAccessToken,
            UUID tenantId,
            UUID userId,
            boolean touchActivity) {

        String tokenHash = SecurityTokenHelper.hashToken(rawAccessToken);

        UserSession session =
                userSessionRepository
                        .findBySessionTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Session not found"
                                )
                        );

        /*
         * Make sure this JWT belongs to the same
         * tenant/user as the stored session.
         */
        if (!session.getTenantId().equals(tenantId)
                || !session.getUserId().equals(userId)) {

            throw new IllegalStateException(
                    "Session identity mismatch"
            );
        }

        /*
         * Explicitly revoked session (e.g. concurrent login from another browser or force reset).
         */
        if (session.getRevokedAt() != null) {
            String reason = session.getRevokeReason() != null ? session.getRevokeReason() : "REVOKED";
            throw new SessionRevokedException(
                    "Session has been revoked",
                    reason
            );
        }

        OffsetDateTime now = OffsetDateTime.now();

        /*
         * Mandatory password reset check: users requiring reset cannot use active sessions.
         */
        if (userSecurityStateRepository != null) {
            UserSecurityState secState = userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId).orElse(null);
            if (secState != null && secState.isPasswordResetRequired()) {
                session.setRevokedAt(now);
                session.setRevokeReason("PASSWORD_RESET_REQUIRED");
                userSessionRepository.save(session);
                throw new SessionRevokedException(
                        "A password reset is required for your account. Please check your email or use Forgot Password.",
                        "PASSWORD_RESET_REQUIRED"
                );
            }
        }

        /*
         * Server-side hard expiry.
         */
        if (session.getExpiresAt() != null
                && session.getExpiresAt().isBefore(now)) {

            session.setRevokedAt(now);
            session.setRevokeReason("EXPIRED");

            userSessionRepository.save(session);

            throw new SessionRevokedException(
                    "Session has expired",
                    "EXPIRED"
            );
        }

        /*
         * Tenant-configured inactivity timeout.
         */
        SecuritySettings settings =
                securitySettingsRepository
                        .findByTenantId(tenantId)
                        .orElse(null);

        if (settings != null
                && settings.getInactivityLogoutMinutes() != null
                && settings.getInactivityLogoutMinutes() > 0
                && session.getLastActivityAt() != null) {

            OffsetDateTime inactivityDeadline =
                    session.getLastActivityAt()
                            .plusMinutes(
                                    settings.getInactivityLogoutMinutes()
                            );

            if (inactivityDeadline.isBefore(now)) {

                session.setRevokedAt(now);
                session.setRevokeReason("INACTIVITY_TIMEOUT");

                userSessionRepository.save(session);

                throw new SessionRevokedException(
                        "Session timed out due to inactivity",
                        "INACTIVITY_TIMEOUT"
                );
            }
        }

        /*
         * Valid authenticated activity - only touch if not a passive status poll.
         */
        if (touchActivity) {
            session.setLastActivityAt(now);
            userSessionRepository.save(session);
        }
    }
}
