package com.enrollnow.common.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SecurityTokenHelperTest {

    @Test
    void generateSecureToken_returnsNonBlankUniqueTokens() {
        String token1 = SecurityTokenHelper.generateSecureToken();
        String token2 = SecurityTokenHelper.generateSecureToken();

        assertNotNull(token1);
        assertNotNull(token2);
        assertFalse(token1.isBlank());
        assertFalse(token2.isBlank());
        assertNotEquals(token1, token2);
        assertTrue(token1.length() >= 40);
    }

    @Test
    void hashToken_computesConsistentSha256Hex() {
        String rawToken = "my-test-token-12345";
        String hash1 = SecurityTokenHelper.hashToken(rawToken);
        String hash2 = SecurityTokenHelper.hashToken(rawToken);

        assertNotNull(hash1);
        assertEquals(hash1, hash2);
        assertEquals(64, hash1.length());
        assertTrue(hash1.matches("^[0-9a-f]{64}$"));
    }

    @Test
    void hashToken_handlesNull() {
        assertNull(SecurityTokenHelper.hashToken(null));
    }
}
