package com.enrollnow.identity.services;

import com.enrollnow.identity.exceptions.SessionRevokedException;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.UserSession;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserSessionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class SessionValidationService {

    private final UserSessionRepository userSessionRepository;
    private final SecuritySettingsRepository securitySettingsRepository;

    public SessionValidationService(
            UserSessionRepository userSessionRepository,
            SecuritySettingsRepository securitySettingsRepository) {

        this.userSessionRepository = userSessionRepository;
        this.securitySettingsRepository = securitySettingsRepository;
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

        String tokenHash = hashToken(rawAccessToken);

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
         * Explicitly revoked session (e.g. concurrent login from another browser).
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
         * Server-side hard expiry.
         * JWT expiry is also checked by Spring Security,
         * but we validate our session record too.
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

    private String hashToken(String token) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            token.getBytes(StandardCharsets.UTF_8)
                    );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException ex) {

            throw new IllegalStateException(
                    "SHA-256 is not available",
                    ex
            );
        }
    }
}
