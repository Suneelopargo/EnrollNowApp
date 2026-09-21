package com.enrollnow.administrator.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateRoleRequest {

    @NotBlank(message = "Role name is required")
    private String roleName;

    @NotBlank(message = "Role code is required")
    private String roleCode;

    private String description;
    private String status = "ACTIVE";
    private List<RolePermissionRequest> permissions;

    public CreateRoleRequest() {}

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public String getRoleCode() { return roleCode; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<RolePermissionRequest> getPermissions() { return permissions; }
    public void setPermissions(List<RolePermissionRequest> permissions) { this.permissions = permissions; }
}
