package com.enrollnow.study.repositories;


import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyMemberRepository extends JpaRepository<StudyMember, StudyMemberId> {

    Optional<StudyMember> findByTenantIdAndIdStudyIdAndIdUserId(
            UUID tenantId,
            UUID studyId,
            UUID userId
    );

    List<StudyMember> findByTenantIdAndIdUserIdAndActiveTrue(
            UUID tenantId,
            UUID userId
    );
}