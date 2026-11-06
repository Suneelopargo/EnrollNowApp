package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.StudyEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyEnrollmentRepository extends JpaRepository<StudyEnrollment, UUID> {

    List<StudyEnrollment> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    List<StudyEnrollment> findByTenantIdAndParticipantIdIn(UUID tenantId, Collection<UUID> participantIds);

    Optional<StudyEnrollment> findByTenantIdAndStudyIdAndParticipantId(UUID tenantId, UUID studyId, UUID participantId);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
