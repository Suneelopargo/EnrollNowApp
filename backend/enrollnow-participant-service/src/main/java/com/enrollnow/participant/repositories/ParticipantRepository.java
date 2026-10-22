package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.Participant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, UUID>, JpaSpecificationExecutor<Participant> {

    Optional<Participant> findByTenantIdAndId(UUID tenantId, UUID id);

    List<Participant> findByTenantId(UUID tenantId);

    Page<Participant> findByTenantId(UUID tenantId, Pageable pageable);

    long countByTenantId(UUID tenantId);
}
