package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.Communication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunicationRepository extends JpaRepository<Communication, UUID> {
    List<Communication> findByTenantIdAndParticipantIdAndChannelOrderByPinnedDescCreatedAtDesc(UUID tenantId, UUID participantId, String channel);
    Optional<Communication> findByTenantIdAndParticipantIdAndId(UUID tenantId, UUID participantId, UUID id);
    List<Communication> findByTenantIdAndParticipantIdOrderByCreatedAtDesc(UUID tenantId, UUID participantId);
    List<Communication> findByTenantIdAndParticipantIdInAndStudyIdIsNullAndChannelIgnoreCaseOrderByCreatedAtDesc(
            UUID tenantId,
            List<UUID> participantIds,
            String channel
    );
    Optional<Communication> findByExternalMessageId(String externalMessageId);
}
