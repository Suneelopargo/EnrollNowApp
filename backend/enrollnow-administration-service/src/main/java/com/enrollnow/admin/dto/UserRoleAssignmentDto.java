package com.enrollnow.admin.dto;

import java.time.OffsetDateTime;

public class UserRoleAssignmentDto {
    private Long roleId;
    private String roleCode;
    private String roleName;
    private boolean assigned;
    private OffsetDateTime validFrom;
    private OffsetDateTime validUntil;

    public UserRoleAssignmentDto() {}

    public UserRoleAssignmentDto(Long roleId, String roleCode, String roleName, boolean assigned) {
        this.roleId = roleId;
        this.roleCode = roleCode;
        this.roleName = roleName;
        this.assigned = assigned;
    }

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public String getRoleCode() { return roleCode; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public boolean isAssigned() { return assigned; }
    public void setAssigned(boolean assigned) { this.assigned = assigned; }
    public OffsetDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(OffsetDateTime validFrom) { this.validFrom = validFrom; }
    public OffsetDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(OffsetDateTime validUntil) { this.validUntil = validUntil; }
}
