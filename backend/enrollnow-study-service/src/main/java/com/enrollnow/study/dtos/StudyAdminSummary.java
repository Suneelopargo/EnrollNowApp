package com.enrollnow.study.dtos;

import java.util.UUID;

public class StudyAdminSummary {

    private UUID userId;
    private String name;
    private String email;
    private String initials;
    private String role;

    public StudyAdminSummary() {
    }

    public StudyAdminSummary(UUID userId, String name, String email, String initials, String role) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.initials = initials;
        this.role = role;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getInitials() {
        return initials;
    }

    public void setInitials(String initials) {
        this.initials = initials;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
