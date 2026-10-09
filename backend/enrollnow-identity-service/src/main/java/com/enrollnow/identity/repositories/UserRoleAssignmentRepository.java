package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleAssignmentRepository
        extends JpaRepository<UserRoleAssignment, UUID> {

    List<UserRoleAssignment> findByTenantIdAndUserId(
            UUID tenantId,
            UUID userId
    );

    List<UserRoleAssignment> findByTenantIdAndUserIdAndActiveTrue(
            UUID tenantId,
            UUID userId
    );

    List<UserRoleAssignment> findByTenantIdAndSiteIdAndActiveTrue(
            UUID tenantId,
            UUID siteId
    );

    List<UserRoleAssignment> findByTenantIdAndTeamIdAndActiveTrue(
            UUID tenantId,
            UUID teamId
    );

    List<UserRoleAssignment> findByTenantIdAndRoleIdAndActiveTrue(
            UUID tenantId,
            UUID roleId
    );

    boolean existsByTenantIdAndUserIdAndRoleIdAndActiveTrue(
            UUID tenantId,
            UUID userId,
            UUID roleId
    );
    
    List<UserRoleAssignment> findByTenantIdAndStudyIdAndActiveTrue(
            UUID tenantId,
            UUID studyId
    );

    List<UserRoleAssignment> findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
            UUID tenantId,
            UUID userId,
            UUID studyId
    );

    boolean existsByTenantIdAndUserIdAndRoleIdAndStudyIdAndActiveTrue(
            UUID tenantId,
            UUID userId,
            UUID roleId,
            UUID studyId
    );
    
    boolean existsByTenantIdAndUserIdAndRoleIdAndSiteIdAndActiveTrue(
            UUID tenantId,
            UUID userId,
            UUID roleId,
            UUID siteId
    );



    boolean existsByTenantIdAndUserIdAndRoleIdAndSiteIdIsNullAndTeamIdIsNullAndStudyIdIsNullAndActiveTrue(
            UUID tenantId,
            UUID userId,
            UUID roleId
    );
    
 
}