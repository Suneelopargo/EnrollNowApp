package com.enrollnow.study.repositories;

import com.enrollnow.study.models.StudySite;
import com.enrollnow.study.models.StudySiteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudySiteRepository
        extends JpaRepository<StudySite, StudySiteId> {

    List<StudySite> findByTenantIdAndIdStudyId(
            UUID tenantId,
            UUID studyId
    );

    List<StudySite> findByTenantIdAndIdStudyIdAndActiveTrue(
            UUID tenantId,
            UUID studyId
    );

    List<StudySite> findByTenantIdAndIdSiteIdAndActiveTrue(
            UUID tenantId,
            UUID siteId
    );

    boolean existsByTenantIdAndIdStudyIdAndIdSiteId(
            UUID tenantId,
            UUID studyId,
            UUID siteId
    );
}