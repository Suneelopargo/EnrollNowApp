package com.enrollnow.administrator.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateUserRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email address is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;
    private Boolean active = true;
    private List<String> roles;
    private List<UserRoleAssignmentDto> roleAssignments;
    private List<Long> locationIds;

    public CreateUserRequest() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<UserRoleAssignmentDto> getRoleAssignments() { return roleAssignments; }
    public void setRoleAssignments(List<UserRoleAssignmentDto> roleAssignments) { this.roleAssignments = roleAssignments; }
    public List<Long> getLocationIds() { return locationIds; }
    public void setLocationIds(List<Long> locationIds) { this.locationIds = locationIds; }
}
