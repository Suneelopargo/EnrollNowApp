package com.enrollnow.participant.models;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "participant_preferences",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_participant_preferences_tenant_id", columnNames = {"tenant_id", "participant_id"})
    }
)
public class ParticipantPreference {

    @Id
    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "preferred_language", length = 20)
    private String preferredLanguage;

    @Column(name = "timezone", length = 100)
    private String timezone;

    @Column(name = "allow_email", nullable = false)
    private boolean allowEmail = true;

    @Column(name = "allow_sms", nullable = false)
    private boolean allowSms = true;

    @Column(name = "allow_phone", nullable = false)
    private boolean allowPhone = true;

    @Column(name = "do_not_contact", nullable = false)
    private boolean doNotContact = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "configuration", columnDefinition = "jsonb")
    private String configuration = "{}";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    public ParticipantPreference() {
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public boolean isAllowEmail() {
        return allowEmail;
    }

    public void setAllowEmail(boolean allowEmail) {
        this.allowEmail = allowEmail;
    }

    public boolean isAllowSms() {
        return allowSms;
    }

    public void setAllowSms(boolean allowSms) {
        this.allowSms = allowSms;
    }

    public boolean isAllowPhone() {
        return allowPhone;
    }

    public void setAllowPhone(boolean allowPhone) {
        this.allowPhone = allowPhone;
    }

    public boolean isDoNotContact() {
        return doNotContact;
    }

    public void setDoNotContact(boolean doNotContact) {
        this.doNotContact = doNotContact;
    }

    public String getConfiguration() {
        return configuration;
    }

    public void setConfiguration(String configuration) {
        this.configuration = configuration != null ? configuration : "{}";
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
