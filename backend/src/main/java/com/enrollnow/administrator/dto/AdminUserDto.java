package com.enrollnow.administrator.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class AdminUserDto {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private boolean active;
    private List<String> roles;
    private List<UserRoleAssignmentDto> roleAssignments;
    private List<AdminSiteAccessDto> assignedLocations;
    private OffsetDateTime createdDate;
    private OffsetDateTime updatedDate;

    public AdminUserDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<UserRoleAssignmentDto> getRoleAssignments() { return roleAssignments; }
    public void setRoleAssignments(List<UserRoleAssignmentDto> roleAssignments) { this.roleAssignments = roleAssignments; }
    public List<AdminSiteAccessDto> getAssignedLocations() { return assignedLocations; }
    public void setAssignedLocations(List<AdminSiteAccessDto> assignedLocations) { this.assignedLocations = assignedLocations; }
    public OffsetDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(OffsetDateTime createdDate) { this.createdDate = createdDate; }
    public OffsetDateTime getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(OffsetDateTime updatedDate) { this.updatedDate = updatedDate; }
}
