package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.RoleResponse;
import com.enrollnow.identity.dtos.UpdateRolePermissionsRequest;
import com.enrollnow.identity.services.RoleService;
import com.enrollnow.identity.services.SiteAuthorizationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
public class RoleController {

    private final RoleService roleService;
    private final SiteAuthorizationService siteAuthorizationService;

    public RoleController(RoleService roleService) {
        this(roleService, null);
    }

    @Autowired
    public RoleController(
            RoleService roleService,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this.roleService = roleService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @GetMapping
    public ResponseEntity<List<RoleResponse>> getRoles(
            @RequestParam(value = "scope", required = false) String scope
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireTenantMatch(null);
        }
        return ResponseEntity.ok(roleService.getRoles(scope));
    }

    @PutMapping("/{roleCode}/permissions")
    public ResponseEntity<Void> updateRolePermissions(
            @PathVariable String roleCode,
            @Valid @RequestBody UpdateRolePermissionsRequest request
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireFullSiteAdmin(null, null);
        }

        roleService.updateRolePermissions(roleCode, request);

        return ResponseEntity.noContent().build();
    }
}