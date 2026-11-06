package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantContactLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantContactLogRepository extends JpaRepository<ParticipantContactLog, UUID> {

    List<ParticipantContactLog> findByTenantIdAndParticipantIdOrderByStickyDescDateTimeOfContactDesc(
            UUID tenantId,
            UUID participantId
    );

    List<ParticipantContactLog> findByTenantIdAndParticipantIdInAndGlobalTrueOrderByDateTimeOfContactDesc(
            UUID tenantId,
            List<UUID> participantIds
    );

    Optional<ParticipantContactLog> findByTenantIdAndParticipantIdAndId(
            UUID tenantId,
            UUID participantId,
            UUID id
    );

    @Query("SELECT DISTINCT l.contactType FROM ParticipantContactLog l WHERE l.tenantId = :tenantId AND (:studyId IS NULL OR l.studyId = :studyId)")
    List<String> findDistinctContactTypes(
            @Param("tenantId") UUID tenantId,
            @Param("studyId") UUID studyId
    );

    long countByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    void deleteByTenantIdAndParticipantIdAndId(UUID tenantId, UUID participantId, UUID id);
}
