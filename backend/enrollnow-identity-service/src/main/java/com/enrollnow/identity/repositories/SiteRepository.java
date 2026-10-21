package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SiteRepository extends JpaRepository<Site, UUID> {

    List<Site> findByTenantIdAndActiveTrue(UUID tenantId);

    Optional<Site> findFirstByTenantIdAndActiveTrueOrderByNameAsc(UUID tenantId);

    Optional<Site> findFirstByTenantId(UUID tenantId);
}
