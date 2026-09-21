package com.enrollnow.auth.dto;

import java.util.List;

public class AuthUserResponse {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private boolean active;
    private List<String> roles;
    private List<String> siteCodes;
    private String organizationName;

    public AuthUserResponse() {}

    public AuthUserResponse(Long id, String username, String email, String firstName, String lastName,
                            String fullName, boolean active, List<String> roles, List<String> siteCodes,
                            String organizationName) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fullName = fullName;
        this.active = active;
        this.roles = roles;
        this.siteCodes = siteCodes;
        this.organizationName = organizationName;
    }

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
    public List<String> getSiteCodes() { return siteCodes; }
    public void setSiteCodes(List<String> siteCodes) { this.siteCodes = siteCodes; }
    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
}
