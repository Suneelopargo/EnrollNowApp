package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.ForgotPasswordRequest;
import com.enrollnow.identity.dtos.LoginRequest;
import com.enrollnow.identity.dtos.LoginResponse;
import com.enrollnow.identity.dtos.PasswordPolicyDto;
import com.enrollnow.identity.dtos.ResetPasswordRequest;
import com.enrollnow.identity.services.LoginService;
import com.enrollnow.identity.services.PasswordRecoveryService;
import com.enrollnow.identity.services.SecuritySettingsService;
import com.enrollnow.identity.services.UserInvitationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private LoginService loginService;

    @Mock
    private PasswordRecoveryService passwordRecoveryService;

    @Mock
    private UserInvitationService userInvitationService;

    @Mock
    private SecuritySettingsService securitySettingsService;

    private AuthController authController;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        authController = new AuthController(
                loginService,
                passwordRecoveryService,
                userInvitationService,
                securitySettingsService
        );
    }

    @Test
    void login_callsLoginService() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("Password123!");

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setAccessToken("jwt-token-123");
        loginResponse.setTokenType("Bearer");

        when(loginService.authenticate(tenantId, req)).thenReturn(loginResponse);

        ResponseEntity<LoginResponse> response = authController.login(tenantId, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("jwt-token-123", response.getBody().getAccessToken());
        verify(loginService).authenticate(tenantId, req);
    }

    @Test
    void getPasswordPolicy_returnsPolicy() {
        PasswordPolicyDto dto = new PasswordPolicyDto(10, "MODERATE", true, true, true);
        when(securitySettingsService.getPublicPasswordPolicy(tenantId, null)).thenReturn(dto);

        ResponseEntity<PasswordPolicyDto> res = authController.getPasswordPolicy(tenantId, null);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(10, res.getBody().getMinimumPasswordLength());
    }

    @Test
    void forgotPassword_returnsGenericMessageWhenEmailNotFound() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("nonexistent@example.com");

        when(passwordRecoveryService.requestPasswordReset(tenantId, req)).thenReturn(null);

        ResponseEntity<?> response = authController.forgotPassword(tenantId, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(String.valueOf(body.get("message")).contains("will receive a reset link"));
    }

    @Test
    void resetPassword_successful_returns200() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("reset-token-xyz");
        req.setNewPassword("NewSecurePass1!");

        doNothing().when(passwordRecoveryService).resetPassword(tenantId, req);

        ResponseEntity<?> res = authController.resetPassword(tenantId, req);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        verify(passwordRecoveryService).resetPassword(tenantId, req);
    }
}
