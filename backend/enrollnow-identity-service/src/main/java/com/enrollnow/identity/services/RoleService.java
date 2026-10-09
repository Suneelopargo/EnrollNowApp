package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.UpdateRolePermissionsRequest;
import com.enrollnow.identity.exceptions.InvalidPermissionException;
import com.enrollnow.identity.exceptions.RoleNotFoundException;
import com.enrollnow.identity.models.Permission;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.RolePermission;
import com.enrollnow.identity.models.RolePermissionId;
import com.enrollnow.identity.repositories.PermissionRepository;
import com.enrollnow.identity.repositories.RolePermissionRepository;
import com.enrollnow.identity.repositories.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public RoleService(
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            RolePermissionRepository rolePermissionRepository
    ) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Transactional
    public void updateRolePermissions(
            String roleCode,
            UpdateRolePermissionsRequest request
    ) {

        String normalizedRoleCode =
                roleCode.trim().toUpperCase(Locale.ROOT);

        Role role = roleRepository.findByCode(normalizedRoleCode)
                .orElseThrow(() ->
                        new RoleNotFoundException(normalizedRoleCode)
                );

        Set<String> requestedCodes = new HashSet<>();

        for (String code : request.getPermissionCodes()) {
            requestedCodes.add(
                    code.trim().toUpperCase(Locale.ROOT)
            );
        }

        List<Permission> permissions =
                permissionRepository.findByCodeIn(requestedCodes);

        if (permissions.size() != requestedCodes.size()) {
        	throw new InvalidPermissionException();
        }

        rolePermissionRepository.deleteByIdRoleId(role.getId());

        for (Permission permission : permissions) {

            RolePermissionId id =
                    new RolePermissionId(
                            role.getId(),
                            permission.getId()
                    );

            RolePermission rolePermission =
                    new RolePermission();

            rolePermission.setId(id);

            rolePermissionRepository.save(rolePermission);
        }
    }
}