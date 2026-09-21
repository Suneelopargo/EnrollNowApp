package com.enrollnow.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UpdateUserRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    private String firstName;
    private String lastName;
    private String phone;
    private Long organizationId;
    private Boolean active;

    public UpdateUserRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
