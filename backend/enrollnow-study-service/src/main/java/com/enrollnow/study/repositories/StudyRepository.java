package com.enrollnow.study.repositories;

import com.enrollnow.study.models.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyRepository extends JpaRepository<Study, UUID> {

    Optional<Study> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<Study> findByTenantIdAndStudyCode(
            UUID tenantId,
            String studyCode
    );

    List<Study> findByTenantId(UUID tenantId);

    List<Study> findByTenantIdAndArchivedFalse(UUID tenantId);

    List<Study> findByTenantIdAndArchivedTrue(UUID tenantId);

    boolean existsByTenantIdAndStudyCode(
            UUID tenantId,
            String studyCode
    );

    boolean existsByTenantIdAndNameIgnoreCase(
            UUID tenantId,
            String name
    );

    Optional<Study> findByTenantIdAndNameIgnoreCase(
            UUID tenantId,
            String name
    );

    boolean existsByTenantIdAndPrefixIgnoreCase(
            UUID tenantId,
            String prefix
    );

    boolean existsByTenantIdAndPrefixIgnoreCaseAndIdNot(
            UUID tenantId,
            String prefix,
            UUID id
    );
}
