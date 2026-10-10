package com.enrollnow.identity.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Service
public class JwtTokenService {

    private final JwtEncoder jwtEncoder;
    private final long expirationSeconds;

    public JwtTokenService(
            @Value("${security.jwt.secret}") String jwtSecret,
            @Value("${security.jwt.expiration-seconds:3600}")
            long expirationSeconds) {

        SecretKey secretKey =
                new SecretKeySpec(
                        jwtSecret.getBytes(StandardCharsets.UTF_8),
                        "HmacSHA256"
                );

        this.jwtEncoder =
                new NimbusJwtEncoder(
                        new ImmutableSecret<SecurityContext>(secretKey)
                );

        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(
            UUID tenantId,
            UUID userId,
            String email) {

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("enrollnow")
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .claim("tenantId", tenantId.toString())
                .claim("email", email)
                .build();

        JwsHeader header =
                JwsHeader.with(MacAlgorithm.HS256).build();

        return jwtEncoder
                .encode(
                        JwtEncoderParameters.from(
                                header,
                                claims
                        )
                )
                .getTokenValue();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}