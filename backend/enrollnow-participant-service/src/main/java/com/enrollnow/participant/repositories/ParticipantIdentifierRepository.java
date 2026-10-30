package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantIdentifier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    Optional<ParticipantIdentifier> findByTenantIdAndIdentifierTypeAndIdentifierValue(
            UUID tenantId, String identifierType, String identifierValue
    );

    @Query("SELECT pi FROM ParticipantIdentifier pi WHERE pi.tenantId = :tenantId AND UPPER(pi.identifierType) = 'GLOBAL_ID' AND UPPER(pi.identifierValue) = UPPER(:value)")
    Optional<ParticipantIdentifier> findGlobalIdIgnoreCase(@Param("tenantId") UUID tenantId, @Param("value") String value);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
