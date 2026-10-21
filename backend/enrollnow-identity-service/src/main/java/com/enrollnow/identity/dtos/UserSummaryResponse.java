package com.enrollnow.identity.dtos;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserSummaryResponse {

    private UUID id;
    private UUID tenantId;
    private UUID siteId;
    private String siteRole;
    private String sitePermissionLabel;
    private String firstName;
    private String lastName;
    private String title;
    private String status;
    private String primaryEmail;
    private List<String> roles = new ArrayList<>();
    private List<String> permissions = new ArrayList<>();
    private List<SiteRoleAssignmentSummary> siteAssignments = new ArrayList<>();
    private boolean canAccessRegistry;
    private boolean canAccessSiteAdmin;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(
            UUID id,
            String firstName,
            String lastName,
            String title,
            String status,
            String primaryEmail
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.title = title;
        this.status = status;
        this.primaryEmail = primaryEmail;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPrimaryEmail() {
        return primaryEmail;
    }

    public void setPrimaryEmail(String primaryEmail) {
        this.primaryEmail = primaryEmail;
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