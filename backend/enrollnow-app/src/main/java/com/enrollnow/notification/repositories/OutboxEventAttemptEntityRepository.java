package com.enrollnow.notification.repositories;

import com.enrollnow.notification.models.OutboxEventAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventAttemptEntityRepository extends JpaRepository<OutboxEventAttemptEntity, UUID> {

    List<OutboxEventAttemptEntity> findByTenantIdAndOutboxEventIdOrderByAttemptNumberAsc(UUID tenantId, UUID outboxEventId);
}
