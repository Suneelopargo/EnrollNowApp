package com.enrollnow.identity.dtos;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class LoginResponse {

    private UUID userId;
    private UUID tenantId;
    private UUID siteId;
    private String siteRole;
    private String sitePermissionLabel;
    private String email;
    private String firstName;
    private String lastName;
    private String accessToken;
    private String tokenType;
    private long expiresIn;
    private List<String> roles = new ArrayList<>();
    private List<String> permissions = new ArrayList<>();
    private List<SiteRoleAssignmentSummary> siteAssignments = new ArrayList<>();
    private boolean canAccessRegistry;
    private boolean canAccessSiteAdmin;

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
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
}