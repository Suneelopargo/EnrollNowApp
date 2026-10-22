package com.enrollnow.common.web;

import com.enrollnow.common.core.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleAccessDenied_returns403() {
        ResponseEntity<ApiResponse<Void>> res = handler.handleAccessDeniedException(new AccessDeniedException("Access denied"));

        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
        assertNotNull(res.getBody());
        assertFalse(res.getBody().isSuccess());
        assertEquals(403, res.getBody().getStatus());
        assertEquals("ACCESS_DENIED", res.getBody().getCode());
    }

    @Test
    void handleAuthentication_badCredentials_returns401() {
        ResponseEntity<ApiResponse<Void>> res = handler.handleAuthenticationException(new BadCredentialsException("Bad creds"));

        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(401, res.getBody().getStatus());
        assertEquals("AUTHENTICATION_FAILED", res.getBody().getCode());
    }

    @Test
    void handleAuthentication_disabled_returns403() {
        ResponseEntity<ApiResponse<Void>> res = handler.handleAuthenticationException(new DisabledException("Disabled"));

        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(403, res.getBody().getStatus());
        assertEquals("ACCOUNT_INACTIVE", res.getBody().getCode());
    }

    @Test
    void handleIllegalArgument_returns400() {
        ResponseEntity<ApiResponse<Void>> res = handler.handleIllegalArgumentException(new IllegalArgumentException("Invalid input"));

        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(400, res.getBody().getStatus());
        assertEquals("BAD_REQUEST", res.getBody().getCode());
        assertEquals("Invalid input", res.getBody().getMessage());
    }
}
