package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.LoginRequest;
import com.enrollnow.identity.dtos.LoginResponse;
import com.enrollnow.identity.exceptions.AccountLockedException;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
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

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

    @Mock
    private UserEmailRepository userEmailRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;

    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenService jwtTokenService;

    @Mock
    private UserSessionService userSessionService;

    @InjectMocks
    private LoginService loginService;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void authenticate_shouldLoginSuccessfully() {

        LoginRequest request = new LoginRequest();
        request.setEmail("  Sriram.Chavali@Solventek.com  ");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("sriram.chavali@solventek.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Sriram");
        user.setLastName("Test");
        user.setStatus("ACTIVE");
        user.setPasswordHash("$argon2id$stored-hash");

        UserSecurityState securityState =
                new UserSecurityState();

        securityState.setTenantId(tenantId);
        securityState.setUserId(userId);
        securityState.setFailedLoginAttempts(2);

        String accessToken = "test-jwt-token";

        when(userEmailRepository
                .findByTenantIdAndEmailIgnoreCase(
                        tenantId,
                        "sriram.chavali@solventek.com"
                ))
                .thenReturn(Optional.of(userEmail));

        when(userRepository
                .findByTenantIdAndId(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.of(user));

        when(userSecurityStateRepository
                .findByTenantIdAndUserId(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.of(securityState));

        when(passwordEncoder.matches(
                "Password@123",
                "$argon2id$stored-hash"
        )).thenReturn(true);

        when(jwtTokenService.generateToken(
                tenantId,
                userId,
                "sriram.chavali@solventek.com"
        )).thenReturn(accessToken);

        when(jwtTokenService.getExpirationSeconds())
                .thenReturn(3600L);

        LoginResponse response =
                loginService.authenticate(
                        tenantId,
                        request
                );

        assertNotNull(response);

        assertEquals(
                userId,
                response.getUserId()
        );

        assertEquals(
                tenantId,
                response.getTenantId()
        );

        assertEquals(
                "sriram.chavali@solventek.com",
                response.getEmail()
        );

        assertEquals(
                "Sriram",
                response.getFirstName()
        );

        assertEquals(
                "Test",
                response.getLastName()
        );

        assertEquals(
                accessToken,
                response.getAccessToken()
        );

        assertEquals(
                "Bearer",
                response.getTokenType()
        );

        assertEquals(
                3600L,
                response.getExpiresIn()
        );

        /*
         * Successful login must reset previous
         * failed-login attempts.
         */
        assertEquals(
                0,
                securityState.getFailedLoginAttempts()
        );

        assertNotNull(
                securityState.getLastActivityAt()
        );

        assertNotNull(
                user.getLastLoginAt()
        );

        verify(passwordEncoder)
                .matches(
                        "Password@123",
                        "$argon2id$stored-hash"
                );

        verify(userSecurityStateRepository)
                .save(securityState);

        verify(userRepository)
                .save(user);

        verify(jwtTokenService)
                .generateToken(
                        tenantId,
                        userId,
                        "sriram.chavali@solventek.com"
                );

        verify(userSessionService)
                .createSession(
                        tenantId,
                        userId,
                        accessToken,
                        3600L
                );
    }

    @Test
    void authenticate_shouldLockAccountWhenInactivityExceeded() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("user@example.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("ACTIVE");
        user.setPasswordHash("$argon2id$stored-hash");

        UserSecurityState securityState = new UserSecurityState();
        securityState.setTenantId(tenantId);
        securityState.setUserId(userId);
        securityState.setLastActivityAt(OffsetDateTime.now().minusDays(95)); // Exceeds 90 days

        SecuritySettings settings = new SecuritySettings();
        settings.setInactivityLockDays(90);

        when(userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, "user@example.com"))
                .thenReturn(Optional.of(userEmail));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(securityState));
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        assertThrows(AccountLockedException.class, () ->
                loginService.authenticate(tenantId, request)
        );

        assertEquals("LOCKED", user.getStatus());
        assertEquals("INACTIVITY_LOCK", securityState.getLockReason());
        assertNotNull(securityState.getLockedAt());
        verify(userRepository).save(user);
        verify(userSecurityStateRepository).save(securityState);
    }

    @Test
    void authenticate_shouldLockAccountWhenPasswordExpired() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("user@example.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("ACTIVE");
        user.setPasswordHash("$argon2id$stored-hash");

        UserSecurityState securityState = new UserSecurityState();
        securityState.setTenantId(tenantId);
        securityState.setUserId(userId);
        securityState.setLastActivityAt(OffsetDateTime.now().minusDays(5));
        securityState.setLastPasswordResetAt(OffsetDateTime.now().minusDays(305)); // Exceeds 300 days

        SecuritySettings settings = new SecuritySettings();
        settings.setInactivityLockDays(90);
        settings.setPasswordExpiryDays(300);

        when(userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, "user@example.com"))
                .thenReturn(Optional.of(userEmail));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(securityState));
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        assertThrows(AccountLockedException.class, () ->
                loginService.authenticate(tenantId, request)
        );

        assertEquals("LOCKED", user.getStatus());
        assertEquals("PASSWORD_EXPIRED", securityState.getLockReason());
        assertNotNull(securityState.getLockedAt());
        verify(userRepository).save(user);
        verify(userSecurityStateRepository).save(securityState);
    }

    @Test
    void authenticate_shouldLockAccountWhenPasswordResetRequired() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("user@example.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("ACTIVE");
        user.setPasswordHash("$argon2id$stored-hash");

        UserSecurityState securityState = new UserSecurityState();
        securityState.setTenantId(tenantId);
        securityState.setUserId(userId);
        securityState.setPasswordResetRequired(true);

        SecuritySettings settings = new SecuritySettings();

        when(userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, "user@example.com"))
                .thenReturn(Optional.of(userEmail));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(securityState));

        AccountLockedException ex = assertThrows(AccountLockedException.class, () ->
                loginService.authenticate(tenantId, request)
        );

        assertEquals("PASSWORD_RESET_REQUIRED", ex.getCode());
        assertTrue(ex.getMessage().contains("Your password has been locked. Please contact an EnrollNow Site Admin"));
        verify(jwtTokenService, never()).generateToken(any(), any(), any());
    }

    @Test
    void authenticate_shouldThrowDisabledExceptionWithTemporaryCodeForDisabledStatus() {
        LoginRequest request = new LoginRequest();
        request.setEmail("disabled@example.com");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("disabled@example.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("DISABLED");

        when(userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, "disabled@example.com"))
                .thenReturn(Optional.of(userEmail));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));

        com.enrollnow.identity.exceptions.AccountDisabledException ex = assertThrows(
                com.enrollnow.identity.exceptions.AccountDisabledException.class,
                () -> loginService.authenticate(tenantId, request)
        );

        assertEquals("ACCOUNT_DISABLED_TEMPORARY", ex.getCode());
        assertTrue(ex.getMessage().contains("temporarily disabled"));
    }

    @Test
    void authenticate_shouldThrowDisabledExceptionWithPermanentCodeForPermanentlyDisabledStatus() {
        LoginRequest request = new LoginRequest();
        request.setEmail("hardlocked@example.com");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("hardlocked@example.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("PERMANENTLY_DISABLED");

        when(userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, "hardlocked@example.com"))
                .thenReturn(Optional.of(userEmail));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));

        com.enrollnow.identity.exceptions.AccountDisabledException ex = assertThrows(
                com.enrollnow.identity.exceptions.AccountDisabledException.class,
                () -> loginService.authenticate(tenantId, request)
        );

        assertEquals("ACCOUNT_DISABLED_PERMANENT", ex.getCode());
        assertTrue(ex.getMessage().contains("permanently disabled"));
    }

    @Test
    void authenticate_shouldThrowLockedExceptionWithMaxAttemptsCodeWhenLockedDueToFailedAttempts() {
        LoginRequest request = new LoginRequest();
        request.setEmail("locked@example.com");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("locked@example.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("LOCKED");

        UserSecurityState securityState = new UserSecurityState();
        securityState.setTenantId(tenantId);
        securityState.setUserId(userId);
        securityState.setLockedAt(OffsetDateTime.now());
        securityState.setLockReason("MAX_FAILED_LOGIN_ATTEMPTS");

        when(userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, "locked@example.com"))
                .thenReturn(Optional.of(userEmail));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(securityState));

        AccountLockedException ex = assertThrows(AccountLockedException.class, () ->
                loginService.authenticate(tenantId, request)
        );

        assertEquals("ACCOUNT_LOCKED_MAX_ATTEMPTS", ex.getCode());
        assertEquals("MAX_FAILED_LOGIN_ATTEMPTS", ex.getReason());
        assertTrue(ex.getMessage().contains("exceeded the allowed number of failed login attempts"));
    }

    @Test
    void authenticate_shouldThrowLockedExceptionWithDefaultCodeWhenLockReasonIsUnknown() {
        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("Password@123");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("unknown@example.com");

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("LOCKED");

        UserSecurityState securityState = new UserSecurityState();
        securityState.setTenantId(tenantId);
        securityState.setUserId(userId);
        securityState.setLockedAt(OffsetDateTime.now());
        securityState.setLockReason(null); // Unknown / null lock reason

        when(userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, "unknown@example.com"))
                .thenReturn(Optional.of(userEmail));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(securityState));

        AccountLockedException ex = assertThrows(AccountLockedException.class, () ->
                loginService.authenticate(tenantId, request)
        );

        assertEquals("ACCOUNT_LOCKED_DEFAULT", ex.getCode());
        assertTrue(ex.getMessage().contains("Your account is locked"));
    }
}
