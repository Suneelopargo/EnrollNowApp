package com.enrollnow.participant.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "participant_contacts",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_participant_contacts_tenant_id", columnNames = {"tenant_id", "id"}),
        @UniqueConstraint(name = "uk_participant_contact_value", columnNames = {"tenant_id", "participant_id", "contact_type", "contact_value"})
    }
)
public class ParticipantContact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "contact_type", nullable = false, length = 30)
    private String contactType;

    @Column(name = "contact_value", nullable = false, length = 320)
    private String contactValue;

    @Column(name = "label", length = 50)
    private String label;

    @Column(name = "primary_contact", nullable = false)
    private boolean primaryContact = false;

    @Column(name = "verified", nullable = false)
    private boolean verified = false;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "contact_name", length = 255)
    private String contactName;

    @Column(name = "relationship", length = 100)
    private String relationship;

    @Column(name = "can_leave_message", nullable = false)
    private boolean canLeaveMessage = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_preferred", nullable = false)
    private boolean isPreferred = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    public ParticipantContact() {
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

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public String getContactType() {
        return contactType;
    }

    public void setContactType(String contactType) {
        this.contactType = contactType;
    }

    public String getContactValue() {
        return contactValue;
    }

    public void setContactValue(String contactValue) {
        this.contactValue = contactValue;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public boolean isPrimaryContact() {
        return primaryContact;
    }

    public void setPrimaryContact(boolean primaryContact) {
        this.primaryContact = primaryContact;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public boolean isCanLeaveMessage() {
        return canLeaveMessage;
    }

    public void setCanLeaveMessage(boolean canLeaveMessage) {
        this.canLeaveMessage = canLeaveMessage;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isPreferred() {
        return isPreferred;
    }

    public void setPreferred(boolean preferred) {
        isPreferred = preferred;
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
