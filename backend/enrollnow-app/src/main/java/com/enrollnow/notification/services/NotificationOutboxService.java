package com.enrollnow.notification.services;

import com.enrollnow.common.events.OutboxEventPublisher;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class NotificationOutboxService implements OutboxEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxService.class);
    public static final int MAX_RETRIES = OutboxEventProcessor.MAX_RETRIES;
    public static final int BATCH_SIZE = 50;
    public static final Duration STALE_LEASE_DURATION = Duration.ofMinutes(5);

    private final OutboxEventEntityRepository outboxRepository;
    private final OutboxEventAttemptEntityRepository attemptRepository;
    private final NotificationDispatcher notificationDispatcher;
    private final ObjectMapper objectMapper;
    private final OutboxEventProcessor outboxEventProcessor;
    private final OutboxEventClaimService outboxEventClaimService;
    private final String instanceId = UUID.randomUUID().toString();

    @Autowired
    public NotificationOutboxService(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            ObjectMapper objectMapper,
            OutboxEventProcessor outboxEventProcessor,
            OutboxEventClaimService outboxEventClaimService) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
        this.notificationDispatcher = notificationDispatcher;
        this.objectMapper = objectMapper;
        this.outboxEventProcessor = outboxEventProcessor;
        this.outboxEventClaimService = outboxEventClaimService;
    }

    public NotificationOutboxService(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            ObjectMapper objectMapper,
            OutboxEventProcessor outboxEventProcessor) {
        this(outboxRepository, attemptRepository, notificationDispatcher, objectMapper,
                outboxEventProcessor, new OutboxEventClaimService(outboxRepository));
    }

    public NotificationOutboxService(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            ObjectMapper objectMapper) {
        this(outboxRepository, attemptRepository, notificationDispatcher, objectMapper,
                new OutboxEventProcessor(outboxRepository, attemptRepository, notificationDispatcher),
                new OutboxEventClaimService(outboxRepository));
    }

    public String getInstanceId() {
        return instanceId;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void publish(
            UUID tenantId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload,
            UUID actorUserId) {
        publishEvent(tenantId, aggregateType, aggregateId, eventType, payload, actorUserId, null);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void publish(
            UUID tenantId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload,
            UUID actorUserId,
            String idempotencyKey) {
        publishEvent(tenantId, aggregateType, aggregateId, eventType, payload, actorUserId, idempotencyKey);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public OutboxEventEntity publishEvent(
            UUID tenantId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload,
            UUID actorUserId) {
        return publishEvent(tenantId, aggregateType, aggregateId, eventType, payload, actorUserId, null);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public OutboxEventEntity publishEvent(
            UUID tenantId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload,
            UUID actorUserId,
            String idempotencyKey) {

        try {
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                Optional<OutboxEventEntity> existing = outboxRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey);
                if (existing.isPresent()) {
                    log.debug("Outbox event with idempotencyKey {} already exists; skipping duplicate", idempotencyKey);
                    return existing.get();
                }
            }

            OutboxEventEntity event = new OutboxEventEntity();
            event.setTenantId(tenantId);
            event.setAggregateType(aggregateType);
            event.setAggregateId(aggregateId);
            event.setEventType(eventType);
            event.setIdempotencyKey(idempotencyKey);
            event.setPayload(objectMapper.writeValueAsString(payload));

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("actorUserId", actorUserId != null ? actorUserId.toString() : null);
            metadata.put("publishedAt", Instant.now().toString());
            event.setMetadata(objectMapper.writeValueAsString(metadata));

            event.setStatus("PENDING");
            event.setAvailableAt(Instant.now());
            event.setCreatedAt(Instant.now());

            OutboxEventEntity saved = outboxRepository.save(event);
            log.info("Persisted transactional outbox event [{}] id: {}", eventType, saved.getId());
            return saved;
        } catch (Exception e) {
            log.error("Failed to serialize or persist outbox event: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to publish outbox event", e);
        }
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:5000}")
    public void processPendingEvents() {
        recoverStaleLeases();

        List<UUID> claimedIds = claimBatch(Instant.now(), MAX_RETRIES, BATCH_SIZE);
        if (claimedIds.isEmpty()) {
            return;
        }

        log.debug("Instance {} claimed {} outbox events for atomic processing", instanceId, claimedIds.size());
        for (UUID eventId : claimedIds) {
            try {
                outboxEventProcessor.processSingleEvent(eventId, instanceId);
            } catch (Exception e) {
                log.error("Unexpected error delegating event {} processing: {}", eventId, e.getMessage(), e);
            }
        }
    }

    /**
     * Delegates to OutboxEventClaimService to ensure Spring proxy enforces REQUIRES_NEW transaction.
     */
    public List<UUID> claimBatch(Instant now, int maxRetries, int batchSize) {
        return outboxEventClaimService.claimBatch(now, maxRetries, batchSize, instanceId);
    }

    /**
     * Delegates to OutboxEventClaimService to ensure Spring proxy enforces REQUIRES_NEW transaction.
     */
    public void recoverStaleLeases() {
        outboxEventClaimService.recoverStaleLeases(STALE_LEASE_DURATION, BATCH_SIZE, MAX_RETRIES);
    }

    public void processSingleEvent(UUID eventId) {
        outboxEventProcessor.processSingleEvent(eventId, instanceId);
    }
}
