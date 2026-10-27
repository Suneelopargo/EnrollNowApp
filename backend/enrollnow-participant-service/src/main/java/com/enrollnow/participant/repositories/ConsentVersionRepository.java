package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ConsentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsentVersionRepository extends JpaRepository<ConsentVersion, UUID> {
    List<ConsentVersion> findByTenantIdAndActiveTrue(UUID tenantId);
    List<ConsentVersion> findByTenantIdAndStudyIdAndActiveTrue(UUID tenantId, UUID studyId);
    Optional<ConsentVersion> findByTenantIdAndId(UUID tenantId, UUID id);
}
