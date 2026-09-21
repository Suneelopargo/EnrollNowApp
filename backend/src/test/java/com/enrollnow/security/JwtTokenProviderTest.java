package com.enrollnow.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private static final String SECRET = "unit-test-secret-key-that-is-at-least-256-bits-long-123456";
    private static final long EXPIRATION = 3600000; // 1 hour
    private static final String ISSUER = "enrollnow-auth-service";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(SECRET, EXPIRATION, ISSUER);
    }

    @Test
    void testGenerateAndValidateToken() {
        UserPrincipal principal = new UserPrincipal(
                42L,
                "trialcoordinator",
                "coordinator@enrollnow.local",
                "hash",
                true,
                List.of(new SimpleGrantedAuthority("ROLE_STUDY_USER"))
        );

        String token = tokenProvider.generateTokenFromUserPrincipal(principal);
        assertNotNull(token);

        assertTrue(tokenProvider.validateToken(token));
        assertEquals(42L, tokenProvider.getUserIdFromJWT(token));
    }

    @Test
    void testExpiredTokenRejection() {
        // Create a provider with negative/zero expiration
        JwtTokenProvider expiredProvider = new JwtTokenProvider(SECRET, -1000, ISSUER);
        UserPrincipal principal = new UserPrincipal(1L, "admin", "admin@local", "hash", true, List.of());
        String expiredToken = expiredProvider.generateTokenFromUserPrincipal(principal);

        assertFalse(tokenProvider.validateToken(expiredToken), "Expired token must be rejected");
    }

    @Test
    void testTamperedTokenRejection() {
        UserPrincipal principal = new UserPrincipal(1L, "admin", "admin@local", "hash", true, List.of());
        String token = tokenProvider.generateTokenFromUserPrincipal(principal);

        String tamperedToken = token + "tampered";
        assertFalse(tokenProvider.validateToken(tamperedToken), "Tampered token must be rejected");
    }

    @Test
    void testInvalidSecretRejection() {
        JwtTokenProvider anotherProvider = new JwtTokenProvider("completely-different-secret-key-for-test-tampering-987654", EXPIRATION, ISSUER);
        UserPrincipal principal = new UserPrincipal(1L, "admin", "admin@local", "hash", true, List.of());
        String tokenFromOther = anotherProvider.generateTokenFromUserPrincipal(principal);

        assertFalse(tokenProvider.validateToken(tokenFromOther), "Token signed with different key must be rejected");
    }
}
