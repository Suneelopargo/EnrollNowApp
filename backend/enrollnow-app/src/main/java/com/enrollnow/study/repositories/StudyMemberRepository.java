package com.enrollnow.study.repositories;

import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyMemberRepository
        extends JpaRepository<StudyMember, StudyMemberId> {

    List<StudyMember> findByTenantIdAndIdStudyId(
            UUID tenantId,
            UUID studyId
    );

    List<StudyMember> findByTenantIdAndIdStudyIdAndActiveTrue(
            UUID tenantId,
            UUID studyId
    );

    List<StudyMember> findByTenantIdAndIdUserIdAndActiveTrue(
            UUID tenantId,
            UUID userId
    );

    boolean existsByTenantIdAndIdStudyIdAndIdUserId(
            UUID tenantId,
            UUID studyId,
            UUID userId
    );
    
    Optional<StudyMember> findByTenantIdAndIdStudyIdAndIdUserId(
            UUID tenantId,
            UUID studyId,
            UUID userId
    );
}