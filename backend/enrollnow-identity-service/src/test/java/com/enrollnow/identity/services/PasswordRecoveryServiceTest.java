package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.ResetPasswordRequest;
import com.enrollnow.identity.exceptions.AlreadyEnrolledException;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserActionToken;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.UserActionTokenRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordRecoveryServiceTest {

    @Mock
    private UserEmailRepository userEmailRepository;

    @Mock
    private UserActionTokenRepository userActionTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private InvitationEmailService invitationEmailService;

    @Mock
    private PasswordPolicyValidator passwordPolicyValidator;

    @Mock
    private UserSessionService userSessionService;

    @InjectMocks
    private PasswordRecoveryService passwordRecoveryService;

    private UUID tenantId;
    private UUID userId;
    private String rawToken;
    private String tokenHash;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        rawToken = "test-reset-token-xyz123";
        tokenHash = hashToken(rawToken);
        passwordRecoveryService.setUserSessionService(userSessionService);
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
    void testResetPassword_SuccessClearsPasswordResetRequiredAndRevokesSessions() {
        UserActionToken token = new UserActionToken();
        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("PASSWORD_RESET");
        token.setExpiresAt(OffsetDateTime.now().plusMinutes(20));

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("LOCKED");

        UserSecurityState secState = new UserSecurityState();
        secState.setTenantId(tenantId);
        secState.setUserId(userId);
        secState.setPasswordResetRequired(true);
        secState.setLockReason("PASSWORD_RESET_REQUIRED");
        secState.setLockedAt(OffsetDateTime.now().minusHours(1));
        secState.setFailedLoginAttempts(3);

        when(userActionTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(secState));
        when(passwordEncoder.encode("NewSecurePass123!")).thenReturn("$argon2id$encoded-hash");

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePass123!");

        passwordRecoveryService.resetPassword(tenantId, request);

        // Verify password policy was validated and history recorded
        verify(passwordPolicyValidator).validatePassword(tenantId, userId, "NewSecurePass123!");
        verify(passwordPolicyValidator).recordPasswordChange(tenantId, userId, "$argon2id$encoded-hash");

        // Verify user updated to active and encoded password set
        assertEquals("$argon2id$encoded-hash", user.getPasswordHash());
        assertEquals("ACTIVE", user.getStatus());
        verify(userRepository).save(user);

        // Verify passwordResetRequired cleared, password lock reason cleared, attempts reset
        assertFalse(secState.isPasswordResetRequired());
        assertNull(secState.getLockReason());
        assertNull(secState.getLockedAt());
        assertEquals(0, secState.getFailedLoginAttempts());
        assertNotNull(secState.getLastPasswordResetAt());
        verify(userSecurityStateRepository).save(secState);

        // Verify active sessions revoked
        verify(userSessionService).revokeExistingSessions(tenantId, userId, "PASSWORD_RESET");

        // Verify token marked used
        assertNotNull(token.getUsedAt());
        verify(userActionTokenRepository).save(token);
    }

    @Test
    void testResetPassword_PreservesInactivityLockAndNonPasswordLocks() {
        UserActionToken token = new UserActionToken();
        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("PASSWORD_RESET");
        token.setExpiresAt(OffsetDateTime.now().plusMinutes(20));

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("LOCKED");

        OffsetDateTime lockTime = OffsetDateTime.now().minusDays(5);
        UserSecurityState secState = new UserSecurityState();
        secState.setTenantId(tenantId);
        secState.setUserId(userId);
        secState.setPasswordResetRequired(true);
        secState.setLockReason("INACTIVITY_LOCK");
        secState.setLockedAt(lockTime);

        when(userActionTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(secState));
        when(passwordEncoder.encode("NewSecurePass123!")).thenReturn("$argon2id$encoded-hash");

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePass123!");

        passwordRecoveryService.resetPassword(tenantId, request);

        // passwordResetRequired cleared and lastPasswordResetAt updated
        assertFalse(secState.isPasswordResetRequired());
        assertNotNull(secState.getLastPasswordResetAt());

        // But INACTIVITY_LOCK must be strictly preserved!
        assertEquals("INACTIVITY_LOCK", secState.getLockReason());
        assertEquals(lockTime, secState.getLockedAt());
        assertEquals("LOCKED", user.getStatus()); // Must remain locked!

        verify(userSecurityStateRepository).save(secState);
        verify(userRepository).save(user);
    }

    @Test
    void testResetPassword_RejectsUsedToken() {
        UserActionToken token = new UserActionToken();
        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("PASSWORD_RESET");
        token.setExpiresAt(OffsetDateTime.now().plusMinutes(20));
        token.setUsedAt(OffsetDateTime.now().minusMinutes(5));

        when(userActionTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePass123!");

        AlreadyEnrolledException ex = assertThrows(AlreadyEnrolledException.class, () ->
                passwordRecoveryService.resetPassword(tenantId, request)
        );
        assertEquals("RESET_TOKEN_USED", ex.getErrorCode());
    }

    @Test
    void testResetPassword_RejectsExpiredToken() {
        UserActionToken token = new UserActionToken();
        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("PASSWORD_RESET");
        token.setExpiresAt(OffsetDateTime.now().minusMinutes(5));

        when(userActionTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePass123!");

        AlreadyEnrolledException ex = assertThrows(AlreadyEnrolledException.class, () ->
                passwordRecoveryService.resetPassword(tenantId, request)
        );
        assertEquals("TOKEN_EXPIRED", ex.getErrorCode());
    }

    @Test
    void testResetPassword_RejectsWrongTenant() {
        UserActionToken token = new UserActionToken();
        token.setTenantId(UUID.randomUUID()); // Different tenant
        token.setUserId(userId);
        token.setTokenType("PASSWORD_RESET");
        token.setExpiresAt(OffsetDateTime.now().plusMinutes(20));

        when(userActionTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePass123!");

        assertThrows(IllegalArgumentException.class, () ->
                passwordRecoveryService.resetPassword(tenantId, request)
        );
    }
}
