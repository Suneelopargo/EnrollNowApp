package com.enrollnow.repository;

import com.enrollnow.models.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByOrgCode(String orgCode);
    Optional<Organization> findByName(String name);
}
