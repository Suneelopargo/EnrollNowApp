package com.enrollnow.identity.dto;

import java.util.List;

public class AuthUserResponse {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Long organizationId;
    private String organizationName;
    private List<String> roles;
    private List<String> siteCodes;

    public AuthUserResponse() {}

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

    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public List<String> getSiteCodes() { return siteCodes; }
    public void setSiteCodes(List<String> siteCodes) { this.siteCodes = siteCodes; }
}
