package com.enrollnow.config;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.exceptions.SessionRevokedException;
import com.enrollnow.identity.services.SessionValidationService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
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
    private final ObjectMapper objectMapper;

    public SessionValidationFilter(
            SessionValidationService sessionValidationService) {
        this(sessionValidationService, new ObjectMapper());
    }

    @Autowired
    public SessionValidationFilter(
            SessionValidationService sessionValidationService,
            @Autowired(required = false) ObjectMapper objectMapper) {

        this.sessionValidationService = sessionValidationService;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
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

                    String uri = request.getRequestURI();
                    boolean isPassive = "true".equalsIgnoreCase(request.getHeader("X-Passive-Check"))
                            || uri.endsWith("/session-status");

                    sessionValidationService
                            .validateSession(
                                    rawToken,
                                    tenantId,
                                    userId,
                                    !isPassive
                            );

                } catch (SessionRevokedException ex) {

                    String reason = ex.getReason() != null ? ex.getReason() : "REVOKED";
                    String message = "NEW_LOGIN".equals(reason)
                            ? "Your session has ended because your account was logged in from another browser or device."
                            : ("INACTIVITY_TIMEOUT".equals(reason)
                            ? "Session expired due to inactivity."
                            : ("PASSWORD_RESET_REQUIRED".equals(reason)
                            ? "A password reset is required for your account. Please check your email or use Forgot Password."
                            : "Session has expired or was revoked."));

                    writeUnauthorizedResponse(
                            response,
                            "SESSION_REVOKED",
                            message,
                            reason
                    );

                    return;

                } catch (Exception ex) {

                    writeUnauthorizedResponse(
                            response,
                            "INVALID_SESSION",
                            "Session is invalid, expired, or revoked",
                            "INVALID_SESSION"
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

    private void writeUnauthorizedResponse(
            HttpServletResponse response,
            String code,
            String message,
            String reason) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        ApiResponse<Void> body = ApiResponse.error(
                HttpServletResponse.SC_UNAUTHORIZED,
                code,
                message,
                reason
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
