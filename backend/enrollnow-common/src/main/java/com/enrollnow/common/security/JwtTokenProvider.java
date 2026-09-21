package com.enrollnow.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider implements JwtVerifier {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long jwtExpirationMs;
    private final String issuer;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:enrollnow-enterprise-development-secret-key-must-be-changed-in-production-12345}") String jwtSecret,
            @Value("${app.jwt.expiration-ms:3600000}") long jwtExpirationMs,
            @Value("${app.jwt.issuer:enrollnow-auth-service}") String issuer) {

        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            this.key = Keys.hmacShaKeyFor(padded);
        } else {
            this.key = Keys.hmacShaKeyFor(keyBytes);
        }
        this.jwtExpirationMs = jwtExpirationMs;
        this.issuer = issuer;
    }

    public String generateToken(Long userId, String username, List<String> roles, Long organizationId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .issuer(issuer)
                .subject(username)
                .claim("userId", userId)
                .claim("roles", roles)
                .claim("organizationId", organizationId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    @Override
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("JWT validation failed: {}", ex.getMessage());
            return false;
        }
    }

    @Override
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @Override
    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    @Override
    public Long getUserIdFromToken(String token) {
        Number userId = getClaims(token).get("userId", Number.class);
        return userId != null ? userId.longValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        return getClaims(token).get("roles", List.class);
    }

    public Long getOrganizationIdFromToken(String token) {
        Number orgId = getClaims(token).get("organizationId", Number.class);
        return orgId != null ? orgId.longValue() : null;
    }
}
