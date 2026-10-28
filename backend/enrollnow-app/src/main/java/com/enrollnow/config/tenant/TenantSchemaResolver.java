package com.enrollnow.config.tenant;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.enrollnow.common.tenant.TenantResolver;

/**
 * Placeholder implementation for resolving an EnrollNow tenant
 * to its opaque PostgreSQL schema.
 *
 * Current development continues to use the canonical "enrollnow"
 * schema. Production tenant-to-schema lookup will later be backed
 * by platform routing metadata and may be cached.
 *
 * This class exists now to make the tenant-routing boundary explicit
 * without prematurely implementing full Hibernate multi-tenancy.
 */
@Component
public class TenantSchemaResolver implements TenantResolver {

    private static final String DEVELOPMENT_SCHEMA = "enrollnow";

    /*
     * Placeholder only.
     *
     * In production this will be replaced by lookup from a platform-level
     * tenant registry, for example:
     *
     * tenant UUID -> opaque schema name
     *
     * No customer business data belongs in that registry.
     */
    private static final Map<UUID, String> TENANT_SCHEMA_PLACEHOLDER = Map.of();

    @Override
    public String resolveSchema(UUID tenantId) {

        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId must not be null");
        }

        /*
         * Development fallback while the application still operates
         * against the canonical enrollnow schema.
         *
         * Do NOT use this fallback as the final production behavior.
         * Production must reject unknown/unmapped tenants.
         */
        return TENANT_SCHEMA_PLACEHOLDER.getOrDefault(
                tenantId,
                DEVELOPMENT_SCHEMA
        );
    }
}