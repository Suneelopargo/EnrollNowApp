package com.enrollnow.config;

import com.enrollnow.identity.services.SessionValidationService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class SessionValidationFilter extends OncePerRequestFilter {

    private final SessionValidationService sessionValidationService;

    public SessionValidationFilter(
            SessionValidationService sessionValidationService) {

        this.sessionValidationService = sessionValidationService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication =
                org.springframework.security.core.context
                        .SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth
                && authentication.isAuthenticated()) {

            Jwt jwt = jwtAuth.getToken();

            String authorizationHeader =
                    request.getHeader("Authorization");

            if (authorizationHeader != null
                    && authorizationHeader.startsWith("Bearer ")) {

                String rawToken =
                        authorizationHeader.substring(7);

                try {

                    UUID tenantId =
                            UUID.fromString(
                                    jwt.getClaimAsString("tenantId")
                            );

                    UUID userId =
                            UUID.fromString(
                                    jwt.getSubject()
                            );

                    sessionValidationService
                            .validateAndTouch(
                                    rawToken,
                                    tenantId,
                                    userId
                            );

                } catch (Exception ex) {

                    response.setStatus(
                            HttpServletResponse.SC_UNAUTHORIZED
                    );

                    response.setContentType(
                            "application/json"
                    );

                    response.getWriter().write(
                            """
                            {
                              "error": "Unauthorized",
                              "message": "Session is invalid, expired, or revoked"
                            }
                            """
                    );

                    return;
                }
            }
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}