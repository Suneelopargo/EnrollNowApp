package com.enrollnow.identity.services;

import com.enrollnow.common.security.SecurityTokenHelper;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.UserSession;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserSessionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserSessionService {

    private final UserSessionRepository userSessionRepository;
    private final SecuritySettingsRepository securitySettingsRepository;

    public UserSessionService(
            UserSessionRepository userSessionRepository,
            SecuritySettingsRepository securitySettingsRepository) {

        this.userSessionRepository = userSessionRepository;
        this.securitySettingsRepository = securitySettingsRepository;
    }

    @Transactional
    public void createSession(
            UUID tenantId,
            UUID userId,
            String accessToken,
            long expirationSeconds) {

        SecuritySettings settings =
                securitySettingsRepository
                        .findByTenantId(tenantId)
                        .orElse(null);

        if (settings != null
                && settings.isPreventConcurrentSessions()) {

            revokeExistingSessions(
                    tenantId,
                    userId,
                    "NEW_LOGIN"
            );
        }

        OffsetDateTime now = OffsetDateTime.now();

        UserSession session = new UserSession();

        session.setTenantId(tenantId);
        session.setUserId(userId);
        session.setSessionTokenHash(
                SecurityTokenHelper.hashToken(accessToken)
        );
        session.setIssuedAt(now);
        session.setLastActivityAt(now);
        session.setExpiresAt(
                now.plusSeconds(expirationSeconds)
        );

        userSessionRepository.save(session);
    }

    @Transactional
    public void revokeExistingSessions(
            UUID tenantId,
            UUID userId,
            String reason) {

        List<UserSession> activeSessions =
                userSessionRepository
                        .findByTenantIdAndUserIdAndRevokedAtIsNull(
                                tenantId,
                                userId
                        );

        OffsetDateTime now = OffsetDateTime.now();

        for (UserSession session : activeSessions) {

            session.setRevokedAt(now);
            session.setRevokeReason(reason);

            userSessionRepository.save(session);
        }
    }
}
