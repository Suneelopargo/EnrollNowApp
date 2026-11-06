package com.enrollnow.identity.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class UserProfileResponse {

    private UUID userId;
    private UUID tenantId;
    private String email;
    private boolean emailVerified;
    private String title;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profilePhotoUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime lastLoginAt;
    private String timezone;
    private boolean ignoreTimezoneMismatch;
    private Integer passwordExpiringDays;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(OffsetDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public boolean isIgnoreTimezoneMismatch() {
        return ignoreTimezoneMismatch;
    }

    public void setIgnoreTimezoneMismatch(boolean ignoreTimezoneMismatch) {
        this.ignoreTimezoneMismatch = ignoreTimezoneMismatch;
    }

    public Integer getPasswordExpiringDays() {
        return passwordExpiringDays;
    }

    public void setPasswordExpiringDays(Integer passwordExpiringDays) {
        this.passwordExpiringDays = passwordExpiringDays;
    }
}
