package com.enrollnow.administrator.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class UpdateUserRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email address is required")
    private String email;

    private Boolean active;
    private List<String> roles;
    private List<UserRoleAssignmentDto> roleAssignments;
    private List<Long> locationIds;

    public UpdateUserRequest() {}

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<UserRoleAssignmentDto> getRoleAssignments() { return roleAssignments; }
    public void setRoleAssignments(List<UserRoleAssignmentDto> roleAssignments) { this.roleAssignments = roleAssignments; }
    public List<Long> getLocationIds() { return locationIds; }
    public void setLocationIds(List<Long> locationIds) { this.locationIds = locationIds; }
}
