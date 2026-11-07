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
    private final String instanceId = UUID.randomUUID().toString();

    @Autowired
    public NotificationOutboxService(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            ObjectMapper objectMapper,
            OutboxEventProcessor outboxEventProcessor) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
        this.notificationDispatcher = notificationDispatcher;
        this.objectMapper = objectMapper;
        this.outboxEventProcessor = outboxEventProcessor;
    }

    public NotificationOutboxService(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            ObjectMapper objectMapper) {
        this(outboxRepository, attemptRepository, notificationDispatcher, objectMapper,
                new OutboxEventProcessor(outboxRepository, attemptRepository, notificationDispatcher));
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<UUID> claimBatch(Instant now, int maxRetries, int batchSize) {
        List<OutboxEventEntity> pendingEvents = outboxRepository.claimPendingEventsForUpdate(now, maxRetries, batchSize);
        if (pendingEvents == null || pendingEvents.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> claimedIds = new ArrayList<>();
        Instant lockTimestamp = Instant.now();
        for (OutboxEventEntity event : pendingEvents) {
            event.setStatus("PROCESSING");
            event.setLockedAt(lockTimestamp);
            event.setLockedBy(instanceId);
            outboxRepository.save(event);
            claimedIds.add(event.getId());
        }
        outboxRepository.flush();
        return claimedIds;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recoverStaleLeases() {
        try {
            Instant leaseThreshold = Instant.now().minus(STALE_LEASE_DURATION);
            List<OutboxEventEntity> staleEvents = outboxRepository.findStaleProcessingEvents(leaseThreshold, BATCH_SIZE);
            if (staleEvents == null || staleEvents.isEmpty()) {
                return;
            }

            log.warn("Detected {} stale PROCESSING outbox events locked before {}", staleEvents.size(), leaseThreshold);
            for (OutboxEventEntity event : staleEvents) {
                int retries = event.getRetryCount() + 1;
                event.setRetryCount(retries);
                event.setLockedAt(null);
                event.setLockedBy(null);
                event.setLastError("Lease expired: worker node timed out or restarted");

                if (retries >= MAX_RETRIES) {
                    event.setStatus("DEAD_LETTER");
                    log.warn("Stale event {} exceeded max retries, moved to DEAD_LETTER", event.getId());
                } else {
                    event.setStatus("FAILED");
                    event.setAvailableAt(Instant.now().plusSeconds(30));
                    log.info("Reset stale event {} to FAILED for retry", event.getId());
                }
                outboxRepository.save(event);
            }
            outboxRepository.flush();
        } catch (Exception e) {
            log.error("Failed during stale outbox lease recovery: {}", e.getMessage(), e);
        }
    }

    public void processSingleEvent(UUID eventId) {
        outboxEventProcessor.processSingleEvent(eventId, instanceId);
    }
}
