package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantIdentifier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantIdentifierRepository extends JpaRepository<ParticipantIdentifier, UUID> {

    List<ParticipantIdentifier> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    List<ParticipantIdentifier> findByTenantIdAndParticipantIdIn(UUID tenantId, Collection<UUID> participantIds);

    Optional<ParticipantIdentifier> findByTenantIdAndParticipantIdAndIdentifierType(
            UUID tenantId, UUID participantId, String identifierType
    );

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
