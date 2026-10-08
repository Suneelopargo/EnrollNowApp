package com.enrollnow.identity.dtos;

import jakarta.validation.constraints.NotBlank;


import java.util.UUID;

public class AssignRoleRequest {

    @NotBlank
    private String roleCode;

    @NotBlank
    private String scopeType;

    private UUID scopeId;

    public String getRoleCode() {
        return roleCode;
    }

    public void setRoleCode(String roleCode) {
        this.roleCode = roleCode;
    }

    public String getScopeType() {
        return scopeType;
    }

    public void setScopeType(String scopeType) {
        this.scopeType = scopeType;
    }

    public UUID getScopeId() {
        return scopeId;
    }

    public void setScopeId(UUID scopeId) {
        this.scopeId = scopeId;
    }
}