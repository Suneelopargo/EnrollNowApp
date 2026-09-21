package com.enrollnow.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class AdminUserDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private boolean active;
    private Long organizationId;
    private String organizationName;
    private List<String> roles;
    private List<String> siteCodes;
    private OffsetDateTime createdAt;

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
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<String> getSiteCodes() { return siteCodes; }
    public void setSiteCodes(List<String> siteCodes) { this.siteCodes = siteCodes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
