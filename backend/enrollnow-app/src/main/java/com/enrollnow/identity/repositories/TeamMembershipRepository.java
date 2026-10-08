package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.TeamMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMembershipRepository
        extends JpaRepository<TeamMembership, UUID> {

    List<TeamMembership> findByTenantIdAndUserId(
            UUID tenantId,
            UUID userId
    );

    List<TeamMembership> findByTenantIdAndUserIdAndActiveTrue(
            UUID tenantId,
            UUID userId
    );

    List<TeamMembership> findByTenantIdAndTeamIdAndActiveTrue(
            UUID tenantId,
            UUID teamId
    );

    Optional<TeamMembership> findByTenantIdAndTeamIdAndUserId(
            UUID tenantId,
            UUID teamId,
            UUID userId
    );

    boolean existsByTenantIdAndTeamIdAndUserId(
            UUID tenantId,
            UUID teamId,
            UUID userId
    );
}