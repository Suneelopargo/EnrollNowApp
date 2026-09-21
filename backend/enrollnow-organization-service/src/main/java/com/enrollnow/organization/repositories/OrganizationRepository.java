package com.enrollnow.organization.repositories;

import com.enrollnow.organization.models.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByOrgCode(String orgCode);
    List<Organization> findByStatus(String status);
    boolean existsByOrgCode(String orgCode);
}
