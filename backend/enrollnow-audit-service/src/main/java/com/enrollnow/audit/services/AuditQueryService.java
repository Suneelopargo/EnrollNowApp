package com.enrollnow.audit.services;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.enrollnow.audit.dtos.AuditEventResponse;
import com.enrollnow.audit.dtos.EntityChangeHistoryResponse;
import com.enrollnow.audit.models.AuditEvent;
import com.enrollnow.audit.models.EntityChangeHistory;
import com.enrollnow.audit.repositories.AuditEventRepository;
import com.enrollnow.audit.repositories.EntityChangeHistoryRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class AuditQueryService {

    private final AuditEventRepository auditEventRepository;
    private final EntityChangeHistoryRepository entityChangeHistoryRepository;

    public AuditQueryService(
            AuditEventRepository auditEventRepository,
            EntityChangeHistoryRepository entityChangeHistoryRepository) {
        this.auditEventRepository = auditEventRepository;
        this.entityChangeHistoryRepository = entityChangeHistoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<AuditEventResponse> getEvents(
            UUID tenantId,
            LocalDate fromDate,
            LocalDate toDate,
            String action,
            String search,
            Pageable pageable) {
        Specification<AuditEvent> specification = (root, query, builder) -> {
            Predicate tenant = builder.equal(root.get("tenantId"), tenantId);
            Predicate filters = tenant;
            if (fromDate != null) {
                OffsetDateTime start = fromDate.atStartOfDay().atOffset(ZoneOffset.UTC);
                filters = builder.and(filters, builder.greaterThanOrEqualTo(root.get("occurredAt"), start));
            }
            if (toDate != null) {
                OffsetDateTime endExclusive = toDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                filters = builder.and(filters, builder.lessThan(root.get("occurredAt"), endExclusive));
            }
            if (action != null && !action.isBlank()) {
                filters = builder.and(filters, builder.equal(
                        builder.lower(root.get("action")), action.trim().toLowerCase()));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate searchable = builder.or(
                        builder.like(builder.lower(root.get("action")), pattern),
                        builder.like(builder.lower(root.get("entityType")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern));
                try {
                    searchable = builder.or(searchable,
                            builder.equal(root.get("actorUserId"), UUID.fromString(search.trim())));
                } catch (IllegalArgumentException ignored) {
                    // Search text is not an actor UUID; the text fields still apply.
                }
                filters = builder.and(filters, searchable);
            }
            return filters;
        };

        return auditEventRepository.findAll(specification, pageable).map(this::toEventResponse);
    }

    @Transactional(readOnly = true)
    public List<EntityChangeHistoryResponse> getChanges(UUID tenantId, UUID auditEventId) {
        if (!auditEventRepository.existsByIdAndTenantId(auditEventId, tenantId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit event not found");
        }
        return entityChangeHistoryRepository
                .findByTenantIdAndAuditEventIdOrderByChangedAtAsc(tenantId, auditEventId)
                .stream()
                .map(this::toChangeResponse)
                .toList();
    }

    private AuditEventResponse toEventResponse(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(), event.getActorUserId(), event.getEntityType(), event.getEntityId(),
                event.getAction(), event.getDescription(), event.getSource(), event.getCorrelationId(),
                event.getRequestId(), event.getBeforeData(), event.getAfterData(),
                event.getOccurredAt(), event.getCreatedAt());
    }

    private EntityChangeHistoryResponse toChangeResponse(EntityChangeHistory change) {
        return new EntityChangeHistoryResponse(
                change.getId(), change.getAuditEventId(), change.getEntityType(), change.getEntityId(),
                change.getFieldName(), change.getPreviousValue(), change.getNewValue(), change.getChangedAt());
    }
}
