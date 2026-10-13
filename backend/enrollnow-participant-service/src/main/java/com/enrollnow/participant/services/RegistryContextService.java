package com.enrollnow.participant.services;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Temporary request context for Phase 8A.
 *
 * The final implementation should resolve tenant/user from the authenticated JWT/security principal.
 * Until the complete identity/security integration is available, optional headers can be supplied:
 * X-Tenant-Id and X-User-Id.
 */
@Component
public class RegistryContextService {
    public static final UUID DEFAULT_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final UUID DEFAULT_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000010");

    public UUID resolveTenantId(UUID tenantId) {
        return tenantId == null ? DEFAULT_TENANT_ID : tenantId;
    }

    public UUID resolveUserId(UUID userId) {
        return userId == null ? DEFAULT_USER_ID : userId;
    }
}
