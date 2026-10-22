package com.enrollnow.config;

import com.enrollnow.identity.exceptions.SessionRevokedException;
import com.enrollnow.identity.services.SessionValidationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionValidationFilterTest {

    @Mock
    private SessionValidationService sessionValidationService;

    @Mock
    private FilterChain filterChain;

    private SessionValidationFilter filter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final String rawToken = "valid-jwt-token-string";

    @BeforeEach
    void setUp() {
        filter = new SessionValidationFilter(sessionValidationService, objectMapper);
        Jwt jwt = Jwt.withTokenValue(rawToken)
                .header("alg", "HS256")
                .subject(userId.toString())
                .claim("tenantId", tenantId.toString())
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
        MDC.put("correlationId", "corr-test-123");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        MDC.clear();
    }

    @Test
    void doFilterInternal_validSession_proceedsAndUpdatesActivity() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/studies");
        request.addHeader("Authorization", "Bearer " + rawToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(sessionValidationService).validateSession(rawToken, tenantId, userId, true);
        verify(filterChain).doFilter(request, response);
        assertEquals(200, response.getStatus());
    }

    @Test
    void doFilterInternal_passiveCheckHeader_doesNotUpdateActivity() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/studies");
        request.addHeader("Authorization", "Bearer " + rawToken);
        request.addHeader("X-Passive-Check", "true");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(sessionValidationService).validateSession(rawToken, tenantId, userId, false);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_sessionRevokedNewLogin_returnsStandardApiResponse401() throws Exception {
        doThrow(new SessionRevokedException("Session revoked", "NEW_LOGIN"))
                .when(sessionValidationService)
                .validateSession(rawToken, tenantId, userId, true);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/studies");
        request.addHeader("Authorization", "Bearer " + rawToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verifyNoInteractions(filterChain);
        assertEquals(401, response.getStatus());
        assertEquals("application/json", response.getContentType());

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertFalse(json.get("success").asBoolean());
        assertEquals(401, json.get("status").asInt());
        assertEquals("SESSION_REVOKED", json.get("code").asText());
        assertEquals("NEW_LOGIN", json.get("reason").asText());
        assertEquals("corr-test-123", json.get("correlationId").asText());
        assertTrue(json.get("message").asText().contains("logged in from another browser"));

        JsonNode errorNode = json.get("error");
        assertNotNull(errorNode);
        assertTrue(errorNode.isObject());
        assertEquals("SESSION_REVOKED", errorNode.get("code").asText());
        assertEquals(json.get("message").asText(), errorNode.get("message").asText());
    }

    @Test
    void doFilterInternal_unexpectedException_returnsInvalidSession401() throws Exception {
        doThrow(new IllegalStateException("Session missing"))
                .when(sessionValidationService)
                .validateSession(rawToken, tenantId, userId, true);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/studies");
        request.addHeader("Authorization", "Bearer " + rawToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verifyNoInteractions(filterChain);
        assertEquals(401, response.getStatus());

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertFalse(json.get("success").asBoolean());
        assertEquals(401, json.get("status").asInt());
        assertEquals("INVALID_SESSION", json.get("code").asText());
        assertEquals("INVALID_SESSION", json.get("reason").asText());
        assertTrue(json.get("error").isObject());
        assertEquals("INVALID_SESSION", json.get("error").get("code").asText());
    }
}
