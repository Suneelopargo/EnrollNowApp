package com.enrollnow.repository;

import com.enrollnow.models.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    Optional<Site> findBySiteCode(String siteCode);
    List<Site> findByStatus(String status);
    List<Site> findByOrganizationId(Long organizationId);
}
