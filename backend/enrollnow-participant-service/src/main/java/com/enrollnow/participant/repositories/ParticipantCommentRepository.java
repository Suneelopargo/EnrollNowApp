package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantCommentRepository extends JpaRepository<ParticipantComment, UUID> {
    List<ParticipantComment> findByTenantIdAndParticipantIdOrderByPinnedDescCreatedAtDesc(UUID tenantId, UUID participantId);
    Optional<ParticipantComment> findByTenantIdAndParticipantIdAndId(UUID tenantId, UUID participantId, UUID id);
    long countByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
