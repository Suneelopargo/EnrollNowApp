package com.enrollnow.common.tenant;

import java.util.UUID;

/**
 * Resolves a logical tenant identifier to its physical persistence target.
 *
 * In the current target architecture, the persistence target is an
 * opaque PostgreSQL schema name.
 *
 * Future implementations may evolve to resolve a tenant to a dedicated
 * database/data source without changing business-module APIs.
 */
public interface TenantResolver {

    /**
     * Resolves the given tenant to its PostgreSQL schema name.
     *
     * @param tenantId logical EnrollNow tenant identifier
     * @return opaque PostgreSQL schema name
     * @throws IllegalArgumentException if tenantId is null
     * @throws IllegalStateException if the tenant cannot be resolved
     */
    String resolveSchema(UUID tenantId);
}