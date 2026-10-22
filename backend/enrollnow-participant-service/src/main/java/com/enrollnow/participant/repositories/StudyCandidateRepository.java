package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.StudyCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyCandidateRepository extends JpaRepository<StudyCandidate, UUID> {

    List<StudyCandidate> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    List<StudyCandidate> findByTenantIdAndParticipantIdIn(UUID tenantId, Collection<UUID> participantIds);

    Optional<StudyCandidate> findByTenantIdAndStudyIdAndParticipantId(UUID tenantId, UUID studyId, UUID participantId);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
