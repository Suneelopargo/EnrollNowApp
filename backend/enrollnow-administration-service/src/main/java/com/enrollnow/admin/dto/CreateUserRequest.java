package com.enrollnow.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateUserRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String firstName;
    private String lastName;
    private String phone;
    private Long organizationId;
    private List<Long> roleIds;
    private List<Long> siteIds;

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
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public List<Long> getRoleIds() { return roleIds; }
    public void setRoleIds(List<Long> roleIds) { this.roleIds = roleIds; }
    public List<Long> getSiteIds() { return siteIds; }
    public void setSiteIds(List<Long> siteIds) { this.siteIds = siteIds; }
}
