package com.enrollnow.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

public class Argon2PasswordEncoderTest {

    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    @Test
    void testArgon2HashingAndVerification() {
        String rawPassword = "SecureClinicalTrialPassword2026!";
        String hash = passwordEncoder.encode(rawPassword);

        assertNotNull(hash);
        assertTrue(hash.startsWith("$argon2id$"), "Hash must use Argon2id format");
        assertNotEquals(rawPassword, hash, "Password must never be stored in plain text");
        assertTrue(passwordEncoder.matches(rawPassword, hash), "Password matching must succeed for correct password");
        assertFalse(passwordEncoder.matches("WrongPassword", hash), "Password matching must fail for incorrect password");
    }

    @Test
    void testUniqueSaltsPerHash() {
        String password = "SamePasswordValue";
        String hash1 = passwordEncoder.encode(password);
        String hash2 = passwordEncoder.encode(password);

        assertNotEquals(hash1, hash2, "Each Argon2 hash must generate a unique random salt");
        assertTrue(passwordEncoder.matches(password, hash1));
        assertTrue(passwordEncoder.matches(password, hash2));
    }
}
