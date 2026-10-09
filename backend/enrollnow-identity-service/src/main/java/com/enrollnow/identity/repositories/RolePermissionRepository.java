package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.RolePermission;
import com.enrollnow.identity.models.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionRepository
        extends JpaRepository<RolePermission, RolePermissionId> {

    List<RolePermission> findByIdRoleId(UUID roleId);

    List<RolePermission> findByIdPermissionId(UUID permissionId);
    
     void deleteByIdRoleId(UUID roleId);
}