package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.RoleResponse;
import com.enrollnow.identity.dtos.UpdateRolePermissionsRequest;
import com.enrollnow.identity.services.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public ResponseEntity<List<RoleResponse>> getRoles(
            @RequestParam(value = "scope", required = false) String scope
    ) {
        return ResponseEntity.ok(roleService.getRoles(scope));
    }

    @PutMapping("/{roleCode}/permissions")
    public ResponseEntity<Void> updateRolePermissions(
            @PathVariable String roleCode,
            @Valid @RequestBody UpdateRolePermissionsRequest request
    ) {

        roleService.updateRolePermissions(roleCode, request);

        return ResponseEntity.noContent().build();
    }
}