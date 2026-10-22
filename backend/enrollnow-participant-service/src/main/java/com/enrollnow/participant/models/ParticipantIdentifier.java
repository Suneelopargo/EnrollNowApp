package com.enrollnow.participant.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "participant_identifiers",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_participant_identifiers_tenant_id", columnNames = {"tenant_id", "id"}),
        @UniqueConstraint(name = "uk_participant_identifier", columnNames = {"tenant_id", "identifier_type", "identifier_value"})
    }
)
public class ParticipantIdentifier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "identifier_type", nullable = false, length = 50)
    private String identifierType;

    @Column(name = "identifier_value", nullable = false, length = 255)
    private String identifierValue;

    @Column(name = "issuing_system", length = 100)
    private String issuingSystem;

    @Column(name = "primary_identifier", nullable = false)
    private boolean primaryIdentifier = false;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    public ParticipantIdentifier() {
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

    public String getIdentifierType() {
        return identifierType;
    }

    public void setIdentifierType(String identifierType) {
        this.identifierType = identifierType;
    }

    public String getIdentifierValue() {
        return identifierValue;
    }

    public void setIdentifierValue(String identifierValue) {
        this.identifierValue = identifierValue;
    }

    public String getIssuingSystem() {
        return issuingSystem;
    }

    public void setIssuingSystem(String issuingSystem) {
        this.issuingSystem = issuingSystem;
    }

    public boolean isPrimaryIdentifier() {
        return primaryIdentifier;
    }

    public void setPrimaryIdentifier(boolean primaryIdentifier) {
        this.primaryIdentifier = primaryIdentifier;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
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
}
