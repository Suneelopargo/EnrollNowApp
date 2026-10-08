package com.enrollnow.identity.dtos;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class UpdateRolePermissionsRequest {

    @NotEmpty
    private List<String> permissionCodes;

    public List<String> getPermissionCodes() {
        return permissionCodes;
    }

    public void setPermissionCodes(List<String> permissionCodes) {
        this.permissionCodes = permissionCodes;
    }
}