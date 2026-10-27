package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantContactRepository extends JpaRepository<ParticipantContact, UUID> {

    List<ParticipantContact> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    List<ParticipantContact> findByTenantIdAndParticipantIdOrderByPrimaryContactDescCreatedAtDesc(UUID tenantId, UUID participantId);

    Optional<ParticipantContact> findByTenantIdAndParticipantIdAndId(UUID tenantId, UUID participantId, UUID id);

    List<ParticipantContact> findByTenantIdAndParticipantIdIn(UUID tenantId, Collection<UUID> participantIds);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
