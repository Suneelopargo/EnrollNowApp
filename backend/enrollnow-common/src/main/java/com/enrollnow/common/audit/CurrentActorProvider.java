package com.enrollnow.common.audit;

import java.util.Optional;
import java.util.UUID;

/**
 * Provides the authenticated application user responsible for
 * the current operation.
 *
 * The implementation is supplied by the application/security layer.
 * Business modules and the audit module do not need to understand
 * JWT or Spring Security internals.
 */
public interface CurrentActorProvider {

    Optional<UUID> getCurrentUserId();
}