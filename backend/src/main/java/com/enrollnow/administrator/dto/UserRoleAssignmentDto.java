package com.enrollnow.administrator.dto;

import java.time.OffsetDateTime;

public class UserRoleAssignmentDto {

    private Long roleId;
    private String roleName;
    private String roleCode;
    private String description;
    private OffsetDateTime validFrom;
    private OffsetDateTime validUntil;
    private String status;
    private boolean currentlyValid;

    public UserRoleAssignmentDto() {}

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public String getRoleCode() { return roleCode; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public OffsetDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(OffsetDateTime validFrom) { this.validFrom = validFrom; }
    public OffsetDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(OffsetDateTime validUntil) { this.validUntil = validUntil; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isCurrentlyValid() { return currentlyValid; }
    public void setCurrentlyValid(boolean currentlyValid) { this.currentlyValid = currentlyValid; }
}
