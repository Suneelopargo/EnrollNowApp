package com.enrollnow.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateRoleRequest {
    @NotBlank(message = "Role name is required")
    private String name;

    @NotBlank(message = "Role code is required")
    private String roleCode;

    private String description;
    private String status;

    public CreateRoleRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRoleCode() { return roleCode; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
