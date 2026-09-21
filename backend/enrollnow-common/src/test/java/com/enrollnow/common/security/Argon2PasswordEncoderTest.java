package com.enrollnow.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

public class Argon2PasswordEncoderTest {

    private PasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        PasswordEncoderConfig config = new PasswordEncoderConfig();
        this.encoder = config.passwordEncoder();
    }

    @Test
    void testEncodeAndMatch() {
        String rawPassword = "StrongPassword2026!";
        String encoded = encoder.encode(rawPassword);

        assertNotNull(encoded);
        assertTrue(encoded.startsWith("$argon2id$"));
        assertTrue(encoder.matches(rawPassword, encoded));
        assertFalse(encoder.matches("WrongPassword", encoded));
    }

    @Test
    void testSaltUniqueness() {
        String password = "SamePassword123!";
        String hash1 = encoder.encode(password);
        String hash2 = encoder.encode(password);

        assertNotEquals(hash1, hash2);
        assertTrue(encoder.matches(password, hash1));
        assertTrue(encoder.matches(password, hash2));
    }
}
