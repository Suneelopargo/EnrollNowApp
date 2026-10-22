package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ParticipantAddressRepository extends JpaRepository<ParticipantAddress, UUID> {

    List<ParticipantAddress> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    List<ParticipantAddress> findByTenantIdAndParticipantIdIn(UUID tenantId, Collection<UUID> participantIds);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
