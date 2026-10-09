package com.enrollnow.study.repositories;

import com.enrollnow.study.models.TeamStudy;
import com.enrollnow.study.models.TeamStudyId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamStudyRepository
        extends JpaRepository<TeamStudy, TeamStudyId> {

    List<TeamStudy> findByTenantIdAndIdTeamId(
            UUID tenantId,
            UUID teamId
    );

    List<TeamStudy> findByTenantIdAndIdStudyId(
            UUID tenantId,
            UUID studyId
    );

    boolean existsByTenantIdAndIdTeamIdAndIdStudyId(
            UUID tenantId,
            UUID teamId,
            UUID studyId
    );
}