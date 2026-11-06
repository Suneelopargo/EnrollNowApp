package com.enrollnow.config.tenant;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.enrollnow.common.tenant.TenantContextHolder;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Establishes and clears tenant context for tenant-scoped requests.
 *
 * Current placeholder behavior:
 * - Extracts tenantId from /api/v1/tenants/{tenantId}/...
 * - Establishes TenantContext for the duration of the request
 * - Always clears TenantContext in finally
 *
 * Future production behavior:
 * - Read authenticated tenantId from JWT/security context
 * - Verify JWT tenantId == path tenantId
 * - Reject mismatches before persistence access
 * - Reject unknown/unmapped tenants
 */
@Component
public class TenantRequestFilter extends OncePerRequestFilter {

    private static final Pattern TENANT_PATH_PATTERN =
            Pattern.compile("^/api/v1/tenants/([^/]+)(?:/.*)?$");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        try {
            UUID tenantId = extractTenantId(request);

            if (tenantId != null) {
            	TenantContextHolder.set(tenantId);
            }

            filterChain.doFilter(request, response);

        } finally {
            TenantContextHolder.clear();
        }
    }

    private UUID extractTenantId(HttpServletRequest request) {

        Matcher matcher = TENANT_PATH_PATTERN.matcher(
                request.getRequestURI()
        );

        if (!matcher.matches()) {
            return null;
        }

        try {
            return UUID.fromString(matcher.group(1));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}