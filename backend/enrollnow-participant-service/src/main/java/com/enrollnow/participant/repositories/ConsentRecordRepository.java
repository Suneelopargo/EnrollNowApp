package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, UUID> {
    List<ConsentRecord> findByTenantIdAndParticipantIdOrderByCreatedAtDesc(UUID tenantId, UUID participantId);
    List<ConsentRecord> findByTenantIdAndParticipantIdInOrderByCreatedAtDesc(UUID tenantId, List<UUID> participantIds);
    Optional<ConsentRecord> findByTenantIdAndParticipantIdAndId(UUID tenantId, UUID participantId, UUID id);
    List<ConsentRecord> findByTenantIdAndParticipantIdAndStudyId(UUID tenantId, UUID participantId, UUID studyId);
}
