package com.enrollnow.study.repositories;

import com.enrollnow.study.models.StudyGrant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudyGrantRepository
        extends JpaRepository<StudyGrant, UUID> {

    List<StudyGrant> findByTenantIdAndStudyId(
            UUID tenantId,
            UUID studyId
    );
}