package com.enrollnow.organization.repositories;

import com.enrollnow.organization.models.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    Optional<Site> findBySiteCode(String siteCode);
    List<Site> findByOrganizationId(Long organizationId);
    List<Site> findByStatus(String status);
    boolean existsBySiteCode(String siteCode);
}
