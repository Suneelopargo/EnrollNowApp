package com.enrollnow.study.repositories;

import com.enrollnow.study.models.StudyMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudyMilestoneRepository
        extends JpaRepository<StudyMilestone, UUID> {

    List<StudyMilestone> findByTenantIdAndStudyIdOrderByMilestoneDateAsc(
            UUID tenantId,
            UUID studyId
    );
}