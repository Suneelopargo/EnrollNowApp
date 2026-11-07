package com.enrollnow.notification.services;

import com.enrollnow.notification.models.OutboxEventAttemptEntity;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.repositories.OutboxEventAttemptEntityRepository;
import com.enrollnow.notification.repositories.OutboxEventEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class NotificationOutboxService {

    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxService.class);
    private static final int MAX_RETRIES = 5;
    private static final int BATCH_SIZE = 50;

    private final OutboxEventEntityRepository outboxRepository;
    private final OutboxEventAttemptEntityRepository attemptRepository;
    private final NotificationDispatcher notificationDispatcher;
    private final ObjectMapper objectMapper;
    private final String instanceId = UUID.randomUUID().toString();

    @Autowired
    public NotificationOutboxService(
            OutboxEventEntityRepository outboxRepository,
            OutboxEventAttemptEntityRepository attemptRepository,
            NotificationDispatcher notificationDispatcher,
            ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
        this.notificationDispatcher = notificationDispatcher;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public OutboxEventEntity publishEvent(
            UUID tenantId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload,
            UUID actorUserId) {

        try {
            OutboxEventEntity event = new OutboxEventEntity();
            event.setTenantId(tenantId);
            event.setAggregateType(aggregateType);
            event.setAggregateId(aggregateId);
            event.setEventType(eventType);
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
        List<OutboxEventEntity> pendingList = outboxRepository.findPendingEvents(
                Instant.now(),
                MAX_RETRIES,
                PageRequest.of(0, BATCH_SIZE)
        );

        if (pendingList.isEmpty()) {
            return;
        }

        log.debug("Processing {} pending notification outbox events", pendingList.size());
        for (OutboxEventEntity event : pendingList) {
            processSingleEvent(event.getId());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSingleEvent(UUID eventId) {
        Optional<OutboxEventEntity> eventOpt = outboxRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            return;
        }

        OutboxEventEntity event = eventOpt.get();
        if ("PROCESSING".equals(event.getStatus()) || "PUBLISHED".equals(event.getStatus())) {
            return;
        }

        int currentAttempt = event.getRetryCount() + 1;
        event.setStatus("PROCESSING");
        event.setLockedAt(Instant.now());
        event.setLockedBy(instanceId);
        outboxRepository.saveAndFlush(event);

        OutboxEventAttemptEntity attempt = new OutboxEventAttemptEntity();
        attempt.setTenantId(event.getTenantId());
        attempt.setOutboxEventId(event.getId());
        attempt.setAttemptNumber(currentAttempt);
        attempt.setProcessor(instanceId);
        attempt.setStartedAt(Instant.now());

        try {
            notificationDispatcher.dispatch(event);

            event.setStatus("PUBLISHED");
            event.setPublishedAt(Instant.now());
            event.setLastError(null);

            attempt.setStatus("SUCCESS");
            attempt.setCompletedAt(Instant.now());
            log.info("Outbox event [{}] id {} processed successfully", event.getEventType(), event.getId());
        } catch (Exception ex) {
            log.error("Error processing outbox event id {}: {}", event.getId(), ex.getMessage(), ex);
            int retries = event.getRetryCount() + 1;
            event.setRetryCount(retries);
            event.setFailedAt(Instant.now());
            event.setLastError(ex.getMessage());

            if (retries >= MAX_RETRIES) {
                event.setStatus("DEAD_LETTER");
            } else {
                event.setStatus("FAILED");
                // Exponential backoff: 30s * 2^(retries-1)
                long delaySeconds = 30L * (1L << (retries - 1));
                event.setAvailableAt(Instant.now().plusSeconds(delaySeconds));
            }

            attempt.setStatus("FAILED");
            attempt.setCompletedAt(Instant.now());
            attempt.setErrorMessage(ex.getMessage());
        } finally {
            attemptRepository.save(attempt);
            outboxRepository.save(event);
        }
    }
}
