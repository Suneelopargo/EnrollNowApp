package com.enrollnow.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long jwtExpirationInMs;
    private final String issuer;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration-ms:3600000}") long jwtExpirationInMs,
            @Value("${app.jwt.issuer:enrollnow-auth-service}") String issuer) {
        
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            this.key = Keys.hmacShaKeyFor(padded);
        } else {
            this.key = Keys.hmacShaKeyFor(keyBytes);
        }
        this.jwtExpirationInMs = jwtExpirationInMs;
        this.issuer = issuer;
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return generateTokenFromUserPrincipal(userPrincipal);
    }

    public String generateTokenFromUserPrincipal(UserPrincipal userPrincipal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(Long.toString(userPrincipal.getId()))
                .claim("username", userPrincipal.getUsername())
                .claim("email", userPrincipal.getEmail())
                .claim("roles", roles)
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.parseLong(claims.getSubject());
    }

    public boolean validateToken(String authToken) {
        if (authToken == null || authToken.isBlank()) {
            return false;
        }
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            logger.warn("JWT validation failed: {}", ex.getMessage());
            return false;
        }
    }
}
