package com.enrollnow.identity.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.OffsetDateTime;
import java.util.UUID;

public class SecuritySettingsDto {

    private UUID id;
    private UUID tenantId;

    @Min(value = 1, message = "Max failed login attempts must be at least 1")
    @Max(value = 100, message = "Max failed login attempts cannot exceed 100")
    private Integer maxFailedLoginAttempts = 10;

    private Boolean preventConcurrentSessions = false;

    @Min(value = 1, message = "Inactivity logout minutes must be at least 1")
    @Max(value = 1440, message = "Inactivity logout minutes cannot exceed 1440")
    private Integer inactivityLogoutMinutes = 30;

    @Min(value = 1, message = "Inactivity lock days must be at least 1")
    private Integer inactivityLockDays = 90;

    @Min(value = 1, message = "Password expiry days must be at least 1")
    private Integer passwordExpiryDays = 300;

    @Min(value = 0, message = "Password history count cannot be negative")
    @Max(value = 24, message = "Password history count cannot exceed 24")
    private Integer passwordHistoryCount = 4;

    @Min(value = 8, message = "Minimum password length must be at least 8")
    @Max(value = 128, message = "Minimum password length cannot exceed 128")
    private Integer minimumPasswordLength = 10;

    private String minimumPasswordStrength = "MODERATE";

    private Boolean requireDigit = true;
    private Boolean requireSymbol = true;
    private Boolean requireMixedCase = true;

    private OffsetDateTime updatedAt;
    private UUID updatedBy;

    public SecuritySettingsDto() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public Integer getMaxFailedLoginAttempts() {
        return maxFailedLoginAttempts;
    }

    public void setMaxFailedLoginAttempts(Integer maxFailedLoginAttempts) {
        this.maxFailedLoginAttempts = maxFailedLoginAttempts;
    }

    public Boolean getPreventConcurrentSessions() {
        return preventConcurrentSessions;
    }

    public void setPreventConcurrentSessions(Boolean preventConcurrentSessions) {
        this.preventConcurrentSessions = preventConcurrentSessions;
    }

    public Integer getInactivityLogoutMinutes() {
        return inactivityLogoutMinutes;
    }

    public void setInactivityLogoutMinutes(Integer inactivityLogoutMinutes) {
        this.inactivityLogoutMinutes = inactivityLogoutMinutes;
    }

    public Integer getInactivityLockDays() {
        return inactivityLockDays;
    }

    public void setInactivityLockDays(Integer inactivityLockDays) {
        this.inactivityLockDays = inactivityLockDays;
    }

    public Integer getPasswordExpiryDays() {
        return passwordExpiryDays;
    }

    public void setPasswordExpiryDays(Integer passwordExpiryDays) {
        this.passwordExpiryDays = passwordExpiryDays;
    }

    public Integer getPasswordHistoryCount() {
        return passwordHistoryCount;
    }

    public void setPasswordHistoryCount(Integer passwordHistoryCount) {
        this.passwordHistoryCount = passwordHistoryCount;
    }

    public Integer getMinimumPasswordLength() {
        return minimumPasswordLength;
    }

    public void setMinimumPasswordLength(Integer minimumPasswordLength) {
        this.minimumPasswordLength = minimumPasswordLength;
    }

    public String getMinimumPasswordStrength() {
        return minimumPasswordStrength;
    }

    public void setMinimumPasswordStrength(String minimumPasswordStrength) {
        this.minimumPasswordStrength = minimumPasswordStrength;
    }

    public Boolean getRequireDigit() {
        return requireDigit;
    }

    public void setRequireDigit(Boolean requireDigit) {
        this.requireDigit = requireDigit;
    }

    public Boolean getRequireSymbol() {
        return requireSymbol;
    }

    public void setRequireSymbol(Boolean requireSymbol) {
        this.requireSymbol = requireSymbol;
    }

    public Boolean getRequireMixedCase() {
        return requireMixedCase;
    }

    public void setRequireMixedCase(Boolean requireMixedCase) {
        this.requireMixedCase = requireMixedCase;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }
}
