package com.enrollnow.identity.dtos;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserEffectivePermissionsResponse {

    private UUID userId;
    private UUID tenantId;
    private UUID siteId;
    private String siteCode;
    private String siteName;
    private String siteRole;
    private String sitePermissionLabel;
    private List<String> roles = new ArrayList<>();
    private List<String> permissions = new ArrayList<>();
    private List<SiteRoleAssignmentSummary> siteAssignments = new ArrayList<>();
    private boolean canAccessRegistry;
    private boolean canAccessSiteAdmin;
    private boolean canManageSiteAdmins;

    public UserEffectivePermissionsResponse() {
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
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

    public String getSiteRole() {
        return siteRole;
    }

    public void setSiteRole(String siteRole) {
        this.siteRole = siteRole;
    }

    public String getSitePermissionLabel() {
        return sitePermissionLabel;
    }

    public void setSitePermissionLabel(String sitePermissionLabel) {
        this.sitePermissionLabel = sitePermissionLabel;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles != null ? roles : new ArrayList<>();
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions != null ? permissions : new ArrayList<>();
    }

    public List<SiteRoleAssignmentSummary> getSiteAssignments() {
        return siteAssignments;
    }

    public void setSiteAssignments(List<SiteRoleAssignmentSummary> siteAssignments) {
        this.siteAssignments = siteAssignments != null ? siteAssignments : new ArrayList<>();
    }

    public boolean isCanAccessRegistry() {
        return canAccessRegistry;
    }

    public void setCanAccessRegistry(boolean canAccessRegistry) {
        this.canAccessRegistry = canAccessRegistry;
    }

    public boolean isCanAccessSiteAdmin() {
        return canAccessSiteAdmin;
    }

    public void setCanAccessSiteAdmin(boolean canAccessSiteAdmin) {
        this.canAccessSiteAdmin = canAccessSiteAdmin;
    }

    public boolean isCanManageSiteAdmins() {
        return canManageSiteAdmins;
    }

    public void setCanManageSiteAdmins(boolean canManageSiteAdmins) {
        this.canManageSiteAdmins = canManageSiteAdmins;
    }
}
