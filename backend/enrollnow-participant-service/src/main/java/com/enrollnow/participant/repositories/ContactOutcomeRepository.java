package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ContactOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactOutcomeRepository extends JpaRepository<ContactOutcome, UUID> {

    List<ContactOutcome> findByTenantIdAndActiveTrueOrderByOutcomeAsc(UUID tenantId);

    Optional<ContactOutcome> findByTenantIdAndOutcomeIgnoreCase(UUID tenantId, String outcome);

    boolean existsByTenantIdAndOutcomeIgnoreCase(UUID tenantId, String outcome);
}
