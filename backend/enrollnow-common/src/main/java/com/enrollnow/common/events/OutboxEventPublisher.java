package com.enrollnow.common.events;

import java.util.UUID;

/**
 * Cross-module contract for publishing transactional outbox events.
 *
 * Business services depend on this interface to publish events within
 * their local database transactions. The implementation persists the event
 * to enrollnow.outbox_events so that both the business data and the outbox event
 * commit or rollback atomically.
 */
public interface OutboxEventPublisher {

    void publish(
            UUID tenantId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload,
            UUID actorUserId
    );

    void publish(
            UUID tenantId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload,
            UUID actorUserId,
            String idempotencyKey
    );
}
