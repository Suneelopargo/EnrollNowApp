package com.enrollnow.notification.repositories;

import com.enrollnow.notification.models.OutboxEventRecipientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OutboxEventRecipientEntityRepository extends JpaRepository<OutboxEventRecipientEntity, UUID> {

    Optional<OutboxEventRecipientEntity> findByTenantIdAndOutboxEventIdAndRecipientEmail(
            UUID tenantId,
            UUID outboxEventId,
            String recipientEmail
    );

    List<OutboxEventRecipientEntity> findByTenantIdAndOutboxEventIdAndStatus(
            UUID tenantId,
            UUID outboxEventId,
            String status
    );

    List<OutboxEventRecipientEntity> findByTenantIdAndOutboxEventId(
            UUID tenantId,
            UUID outboxEventId
    );
}
