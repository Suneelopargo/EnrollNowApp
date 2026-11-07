package com.enrollnow.notification.repositories;

import com.enrollnow.notification.models.OutboxEventEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OutboxEventEntityRepository extends JpaRepository<OutboxEventEntity, UUID> {

    @Query("SELECT e FROM OutboxEventEntity e " +
           "WHERE e.status IN ('PENDING', 'FAILED') " +
           "AND e.availableAt <= :now " +
           "AND e.retryCount < :maxRetries " +
           "ORDER BY e.availableAt ASC, e.createdAt ASC")
    List<OutboxEventEntity> findPendingEvents(
            @Param("now") Instant now,
            @Param("maxRetries") int maxRetries,
            Pageable pageable
    );

    @Query(value = "SELECT * FROM enrollnow.outbox_events e " +
                   "WHERE e.status IN ('PENDING', 'FAILED') " +
                   "AND e.available_at <= :now " +
                   "AND e.retry_count < :maxRetries " +
                   "ORDER BY e.available_at ASC, e.created_at ASC " +
                   "LIMIT :batchSize " +
                   "FOR UPDATE SKIP LOCKED",
           nativeQuery = true)
    List<OutboxEventEntity> claimPendingEventsForUpdate(
            @Param("now") Instant now,
            @Param("maxRetries") int maxRetries,
            @Param("batchSize") int batchSize
    );

    @Query(value = "SELECT * FROM enrollnow.outbox_events e " +
                   "WHERE e.status = 'PROCESSING' " +
                   "AND e.locked_at < :leaseThreshold " +
                   "LIMIT :batchSize " +
                   "FOR UPDATE SKIP LOCKED",
           nativeQuery = true)
    List<OutboxEventEntity> findStaleProcessingEvents(
            @Param("leaseThreshold") Instant leaseThreshold,
            @Param("batchSize") int batchSize
    );

    Optional<OutboxEventEntity> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<OutboxEventEntity> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);
}
