package com.enrollnow.identity.services;

import com.enrollnow.identity.exceptions.SessionRevokedException;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.models.UserSession;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import com.enrollnow.identity.repositories.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionValidationServiceTest {

    @Mock
    private UserSessionRepository userSessionRepository;

    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;

    @InjectMocks
    private SessionValidationService sessionValidationService;

    private UUID tenantId;
    private UUID userId;
    private String rawToken;
    private String tokenHash;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        rawToken = "session-raw-token-12345";
        tokenHash = hashToken(rawToken);
        sessionValidationService.setUserSecurityStateRepository(userSecurityStateRepository);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testValidateSession_RevokesSessionWhenPasswordResetRequired() {
        UserSession session = new UserSession();
        session.setTenantId(tenantId);
        session.setUserId(userId);
        session.setExpiresAt(OffsetDateTime.now().plusHours(8));
        session.setLastActivityAt(OffsetDateTime.now());

        UserSecurityState secState = new UserSecurityState();
        secState.setTenantId(tenantId);
        secState.setUserId(userId);
        secState.setPasswordResetRequired(true);

        when(userSessionRepository.findBySessionTokenHash(tokenHash)).thenReturn(Optional.of(session));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(secState));

        SessionRevokedException ex = assertThrows(SessionRevokedException.class, () ->
                sessionValidationService.validateSession(rawToken, tenantId, userId, false)
        );

        assertEquals("PASSWORD_RESET_REQUIRED", ex.getReason());
        assertNotNull(session.getRevokedAt());
        assertEquals("PASSWORD_RESET_REQUIRED", session.getRevokeReason());
        verify(userSessionRepository).save(session);
    }

    @Test
    void testValidateSession_ValidSessionSuccess() {
        UserSession session = new UserSession();
        session.setTenantId(tenantId);
        session.setUserId(userId);
        session.setExpiresAt(OffsetDateTime.now().plusHours(8));
        session.setLastActivityAt(OffsetDateTime.now().minusMinutes(2));

        UserSecurityState secState = new UserSecurityState();
        secState.setTenantId(tenantId);
        secState.setUserId(userId);
        secState.setPasswordResetRequired(false);

        SecuritySettings settings = new SecuritySettings();
        settings.setInactivityLogoutMinutes(30);

        when(userSessionRepository.findBySessionTokenHash(tokenHash)).thenReturn(Optional.of(session));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(secState));
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        assertDoesNotThrow(() ->
                sessionValidationService.validateSession(rawToken, tenantId, userId, true)
        );

        verify(userSessionRepository).save(session);
    }
}
