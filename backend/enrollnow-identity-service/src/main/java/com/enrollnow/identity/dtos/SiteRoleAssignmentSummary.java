package com.enrollnow.identity.dtos;

import java.util.UUID;

public class SiteRoleAssignmentSummary {

    private UUID siteId;
    private String siteCode;
    private String siteName;
    private String roleCode;
    private String roleName;
    private String permissionLabel;

    public SiteRoleAssignmentSummary() {
    }

    public SiteRoleAssignmentSummary(
            UUID siteId,
            String siteCode,
            String siteName,
            String roleCode,
            String roleName,
            String permissionLabel
    ) {
        this.siteId = siteId;
        this.siteCode = siteCode;
        this.siteName = siteName;
        this.roleCode = roleCode;
        this.roleName = roleName;
        this.permissionLabel = permissionLabel;
    }

    public UUID getSiteId() {
        return siteId;
    }

    public void setSiteId(UUID siteId) {
        this.siteId = siteId;
    }

    public String getSiteCode() {
        return siteCode;
    }

    public void setSiteCode(String siteCode) {
        this.siteCode = siteCode;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public void setRoleCode(String roleCode) {
        this.roleCode = roleCode;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getPermissionLabel() {
        return permissionLabel;
    }

    public void setPermissionLabel(String permissionLabel) {
        this.permissionLabel = permissionLabel;
    }
}
