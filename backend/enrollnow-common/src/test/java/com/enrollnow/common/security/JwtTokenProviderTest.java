package com.enrollnow.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private static final String SECRET = "testing-jwt-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-256";
    private static final long EXPIRATION_MS = 60000;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(SECRET, EXPIRATION_MS, "test-issuer");
    }

    @Test
    void testTokenGenerationAndValidation() {
        String token = tokenProvider.generateToken(101L, "dr_smith", List.of("ROLE_SUPER_ADMIN", "ROLE_STUDY_USER"), 1L);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals("dr_smith", tokenProvider.getUsernameFromToken(token));
        assertEquals(101L, tokenProvider.getUserIdFromToken(token));
        assertEquals(List.of("ROLE_SUPER_ADMIN", "ROLE_STUDY_USER"), tokenProvider.getRolesFromToken(token));
        assertEquals(1L, tokenProvider.getOrganizationIdFromToken(token));
    }

    @Test
    void testInvalidTokenSignature() {
        JwtTokenProvider anotherProvider = new JwtTokenProvider("different-secret-key-different-secret-key-different-secret-key", EXPIRATION_MS, "test-issuer");
        String token = anotherProvider.generateToken(202L, "hacker", List.of("ROLE_ADMIN"), 2L);

        assertFalse(tokenProvider.validateToken(token));
    }

    @Test
    void testExpiredToken() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(SECRET, -1000, "test-issuer");
        String token = expiredProvider.generateToken(303L, "expired_user", List.of("ROLE_USER"), 1L);

        assertFalse(tokenProvider.validateToken(token));
    }
}
