package com.enrollnow.identity.exceptions;

import com.enrollnow.common.core.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class IdentityExceptionHandlerTest {

    private IdentityExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new IdentityExceptionHandler();
    }

    @Test
    void handleUserNotFound_returns404WithUserNotFoundCode() {
        UUID userId = UUID.randomUUID();
        ResponseEntity<ApiResponse<Void>> res = exceptionHandler.handleUserNotFound(new UserNotFoundException(userId));

        assertEquals(HttpStatus.NOT_FOUND, res.getStatusCode());
        assertNotNull(res.getBody());
        assertFalse(res.getBody().isSuccess());
        assertEquals("USER_NOT_FOUND", res.getBody().getCode());
        assertEquals(404, res.getBody().getStatus());
        assertTrue(res.getBody().getMessage().contains(userId.toString()));
    }

    @Test
    void handleInvalidCredentials_returns401() {
        ResponseEntity<ApiResponse<Void>> res = exceptionHandler.handleInvalidCredentials(new InvalidCredentialsException());

        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("INVALID_CREDENTIALS", res.getBody().getCode());
        assertEquals(401, res.getBody().getStatus());
    }

    @Test
    void handleAccountLocked_returns423WithCodeAndReason() {
        AccountLockedException ex = new AccountLockedException(
                "ACCOUNT_LOCKED_MAX_ATTEMPTS",
                "Max attempts exceeded",
                "MAX_FAILED_LOGIN_ATTEMPTS"
        );

        ResponseEntity<ApiResponse<Void>> res = exceptionHandler.handleAccountLocked(ex);

        assertEquals(HttpStatus.LOCKED, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("ACCOUNT_LOCKED_MAX_ATTEMPTS", res.getBody().getCode());
        assertEquals("MAX_FAILED_LOGIN_ATTEMPTS", res.getBody().getReason());
        assertEquals(423, res.getBody().getStatus());
    }

    @Test
    void handleAccountDisabled_returns403() {
        AccountDisabledException ex = new AccountDisabledException("ACCOUNT_DISABLED_TEMPORARY", "Temporarily disabled");

        ResponseEntity<ApiResponse<Void>> res = exceptionHandler.handleAccountDisabled(ex);

        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("ACCOUNT_DISABLED_TEMPORARY", res.getBody().getCode());
        assertEquals(403, res.getBody().getStatus());
    }
}
