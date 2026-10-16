package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.LoginRequest;
import com.enrollnow.identity.dtos.LoginResponse;
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
}