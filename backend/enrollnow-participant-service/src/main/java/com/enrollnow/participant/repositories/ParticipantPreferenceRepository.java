package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantPreferenceRepository extends JpaRepository<ParticipantPreference, UUID> {

    Optional<ParticipantPreference> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    List<ParticipantPreference> findByTenantIdAndParticipantIdIn(UUID tenantId, Collection<UUID> participantIds);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
