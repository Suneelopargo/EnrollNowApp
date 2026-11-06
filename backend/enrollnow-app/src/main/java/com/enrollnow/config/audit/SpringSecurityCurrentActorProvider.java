package com.enrollnow.config.audit;

import java.util.Optional;
import java.util.UUID;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.enrollnow.common.audit.CurrentActorProvider;

/**
 * Resolves the currently authenticated EnrollNow user from Spring Security.
 *
 * For normal JWT-authenticated API requests, the JWT subject is the user UUID.
 *
 * System/background operations may legitimately have no authenticated user,
 * in which case Optional.empty() is returned.
 */
@Component
public class SpringSecurityCurrentActorProvider implements CurrentActorProvider {

    @Override
    public Optional<UUID> getCurrentUserId() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || authentication instanceof AnonymousAuthenticationToken
                || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof Jwt jwt) {
            return parseUuid(jwt.getSubject());
        }

        UUID authenticationName = parseUuidValue(authentication.getName());

        return Optional.ofNullable(authenticationName);
    }

    private Optional<UUID> parseUuid(String raw) {
        return Optional.ofNullable(parseUuidValue(raw));
    }

    private UUID parseUuidValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}