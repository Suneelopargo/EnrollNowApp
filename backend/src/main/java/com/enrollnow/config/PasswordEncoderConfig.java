package com.enrollnow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Standard Argon2id configuration:
        // saltLength: 16 bytes, hashLength: 32 bytes, parallelism: 1, memory: 65536 KiB (64 MB), iterations: 3
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }
}
