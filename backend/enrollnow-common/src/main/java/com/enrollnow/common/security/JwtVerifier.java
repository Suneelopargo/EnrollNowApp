package com.enrollnow.common.security;

import io.jsonwebtoken.Claims;

public interface JwtVerifier {
    boolean validateToken(String token);
    Claims getClaims(String token);
    String getUsernameFromToken(String token);
    Long getUserIdFromToken(String token);
}
