package com.enrollnow.common.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Authoritative security utility for cryptographically secure token generation
 * and SHA-256 hashing across EnrollNow backend modules.
 */
public final class SecurityTokenHelper {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SecurityTokenHelper() {
        // Non-instantiable utility class
    }

    /**
     * Generates a cryptographically secure, URL-safe Base64 random token of 32 bytes (256 bits).
     *
     * @return 43-character URL-safe string
     */
    public static String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Hashes an input token string using standard SHA-256 and outputs a lowercase hex string.
     *
     * @param token raw token to hash
     * @return 64-character hex hash, or null if token is null
     */
    public static String hashToken(String token) {
        if (token == null) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 message digest algorithm is not available in runtime", ex);
        }
    }
}
