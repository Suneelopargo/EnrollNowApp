package com.enrollnow.study.repositories;

import com.enrollnow.study.models.StudyRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyRequirementRepository
        extends JpaRepository<StudyRequirement, UUID> {

    Optional<StudyRequirement> findByTenantIdAndStudyId(
            UUID tenantId,
            UUID studyId
    );
}