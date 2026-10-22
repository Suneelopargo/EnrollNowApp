package com.enrollnow.common.security;

import io.jsonwebtoken.Claims;

/**
 * @deprecated Legacy JJWT verifier interface retained only for backward compatibility.
 */
@Deprecated(since = "1.0.0", forRemoval = true)
public interface JwtVerifier {
    boolean validateToken(String token);
    Claims getClaims(String token);
    String getUsernameFromToken(String token);
    Long getUserIdFromToken(String token);
}
