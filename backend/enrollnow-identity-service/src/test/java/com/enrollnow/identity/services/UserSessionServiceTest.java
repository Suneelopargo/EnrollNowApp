package com.enrollnow.identity.services;

import com.enrollnow.common.security.SecurityTokenHelper;
import com.enrollnow.identity.models.UserSession;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSessionServiceTest {

    @Mock
    private UserSessionRepository userSessionRepository;
    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    private UserSessionService service;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final String accessToken = "test-access-token";

    @BeforeEach
    void setUp() {
        service = new UserSessionService(userSessionRepository, securitySettingsRepository);
    }

    @Test
    void revokeSessionRevokesOnlyTheMatchingToken() {
        UserSession session = new UserSession();
        session.setTenantId(tenantId);
        session.setUserId(userId);
        session.setSessionTokenHash(SecurityTokenHelper.hashToken(accessToken));
        when(userSessionRepository.findBySessionTokenHash(SecurityTokenHelper.hashToken(accessToken)))
                .thenReturn(Optional.of(session));

        service.revokeSession(tenantId, userId, accessToken, "USER_LOGOUT");

        assertThat(session.getRevokedAt()).isNotNull();
        assertThat(session.getRevokeReason()).isEqualTo("USER_LOGOUT");
        verify(userSessionRepository).save(session);
        verify(userSessionRepository, never()).findByTenantIdAndUserIdAndRevokedAtIsNull(any(), any());
    }

    @Test
    void revokeSessionRejectsTokenForDifferentUser() {
        UserSession session = new UserSession();
        session.setTenantId(tenantId);
        session.setUserId(UUID.randomUUID());
        session.setSessionTokenHash(SecurityTokenHelper.hashToken(accessToken));
        when(userSessionRepository.findBySessionTokenHash(SecurityTokenHelper.hashToken(accessToken)))
                .thenReturn(Optional.of(session));

        assertThrows(IllegalStateException.class, () ->
                service.revokeSession(tenantId, userId, accessToken, "USER_LOGOUT"));

        verify(userSessionRepository, never()).save(any());
    }
}
