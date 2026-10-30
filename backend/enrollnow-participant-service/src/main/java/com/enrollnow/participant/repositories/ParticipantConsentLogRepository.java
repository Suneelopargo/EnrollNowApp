package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantConsentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantConsentLogRepository extends JpaRepository<ParticipantConsentLog, UUID> {

    List<ParticipantConsentLog> findByTenantIdAndParticipantIdOrderByStickyDescConsentDateDesc(
            UUID tenantId,
            UUID participantId
    );

    Optional<ParticipantConsentLog> findByTenantIdAndParticipantIdAndId(
            UUID tenantId,
            UUID participantId,
            UUID id
    );

    @Query("SELECT DISTINCT l.consentType FROM ParticipantConsentLog l " +
           "WHERE l.tenantId = :tenantId AND (:studyId IS NULL OR l.studyId = :studyId) " +
           "ORDER BY l.consentType ASC")
    List<String> findDistinctConsentTypes(
            @Param("tenantId") UUID tenantId,
            @Param("studyId") UUID studyId
    );
}
