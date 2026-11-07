package com.enrollnow.identity.services;

import java.util.UUID;

/**
 * Contract for triggering daily digest email generation and dispatch.
 */
public interface DailyDigestTriggerService {

    /**
     * Triggers generation and dispatch of the daily digest for a specific user within a tenant.
     *
     * @param tenantId Target tenant ID
     * @param userId Target user ID
     */
    void triggerDailyDigest(UUID tenantId, UUID userId);
}
