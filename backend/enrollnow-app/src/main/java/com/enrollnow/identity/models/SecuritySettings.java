package com.enrollnow.identity.models;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "security_settings",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_security_settings_tenant",
            columnNames = {"tenant_id"}
        )
    }
)
public class SecuritySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "max_failed_login_attempts")
    private Integer maxFailedLoginAttempts;

    @Column(name = "prevent_concurrent_sessions", nullable = false)
    private boolean preventConcurrentSessions = false;

    @Column(name = "inactivity_logout_minutes")
    private Integer inactivityLogoutMinutes;

    @Column(name = "inactivity_lock_days")
    private Integer inactivityLockDays;

    @Column(name = "password_expiry_days")
    private Integer passwordExpiryDays;

    @Column(name = "password_history_count")
    private Integer passwordHistoryCount;

    @Column(name = "minimum_password_length")
    private Integer minimumPasswordLength;

    @Column(name = "minimum_password_strength", length = 30)
    private String minimumPasswordStrength;

    @Column(name = "require_digit", nullable = false)
    private boolean requireDigit = false;

    @Column(name = "require_symbol", nullable = false)
    private boolean requireSymbol = false;

    @Column(name = "require_mixed_case", nullable = false)
    private boolean requireMixedCase = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
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

    public boolean isPreventConcurrentSessions() {
        return preventConcurrentSessions;
    }

    public void setPreventConcurrentSessions(boolean preventConcurrentSessions) {
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

    public boolean isRequireDigit() {
        return requireDigit;
    }

    public void setRequireDigit(boolean requireDigit) {
        this.requireDigit = requireDigit;
    }

    public boolean isRequireSymbol() {
        return requireSymbol;
    }

    public void setRequireSymbol(boolean requireSymbol) {
        this.requireSymbol = requireSymbol;
    }

    public boolean isRequireMixedCase() {
        return requireMixedCase;
    }

    public void setRequireMixedCase(boolean requireMixedCase) {
        this.requireMixedCase = requireMixedCase;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
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