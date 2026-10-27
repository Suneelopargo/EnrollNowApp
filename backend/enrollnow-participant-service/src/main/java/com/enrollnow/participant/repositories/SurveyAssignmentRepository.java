package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.SurveyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SurveyAssignmentRepository extends JpaRepository<SurveyAssignment, UUID> {
    List<SurveyAssignment> findByTenantIdAndParticipantIdOrderByAssignedAtDesc(UUID tenantId, UUID participantId);
    Optional<SurveyAssignment> findByTenantIdAndParticipantIdAndId(UUID tenantId, UUID participantId, UUID id);
    List<SurveyAssignment> findByTenantIdAndParticipantIdAndStudyId(UUID tenantId, UUID participantId, UUID studyId);
}
