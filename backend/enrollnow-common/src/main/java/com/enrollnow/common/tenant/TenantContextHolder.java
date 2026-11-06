package com.enrollnow.common.tenant;

import java.util.UUID;

/**
 * Holds the current request's tenant identifier.
 *
 * Backed by ThreadLocal because Spring MVC request processing is
 * thread-bound in the current application model.
 *
 * IMPORTANT:
 * The tenant identifier must always be cleared after request processing
 * to prevent tenant leakage between reused application threads.
 */
public final class TenantContextHolder {

    private static final ThreadLocal<UUID> TENANT_ID = new ThreadLocal<>();

    private TenantContextHolder() {
    }

    public static void set(UUID tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId must not be null");
        }

        TENANT_ID.set(tenantId);
    }

    public static UUID get() {
        return TENANT_ID.get();
    }

    public static UUID require() {
        UUID tenantId = TENANT_ID.get();

        if (tenantId == null) {
            throw new IllegalStateException(
                    "Tenant context has not been established"
            );
        }

        return tenantId;
    }

    public static void clear() {
        TENANT_ID.remove();
    }
}