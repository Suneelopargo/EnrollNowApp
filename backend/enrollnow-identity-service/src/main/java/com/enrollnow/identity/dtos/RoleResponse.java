package com.enrollnow.identity.dtos;

import java.util.UUID;

public class RoleResponse {

    private UUID id;
    private String code;
    private String name;
    private String scopeType;
    private String description;
    private boolean systemRole;
    private boolean active;

    public RoleResponse() {
    }

    public RoleResponse(
            UUID id,
            String code,
            String name,
            String scopeType,
            String description,
            boolean systemRole,
            boolean active
    ) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.scopeType = scopeType;
        this.description = description;
        this.systemRole = systemRole;
        this.active = active;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getScopeType() {
        return scopeType;
    }

    public void setScopeType(String scopeType) {
        this.scopeType = scopeType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isSystemRole() {
        return systemRole;
    }

    public void setSystemRole(boolean systemRole) {
        this.systemRole = systemRole;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
