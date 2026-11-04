package com.enrollnow.study.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "tenant_contact_taxonomy_options",
        schema = "enrollnow"
)
public class TenantContactTaxonomyOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "taxonomy_type", nullable = false, length = 30)
    private String taxonomyType;

    @Column(name = "option_value", nullable = false, length = 255)
    private String optionValue;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public TenantContactTaxonomyOption() {
    }

    public TenantContactTaxonomyOption(UUID tenantId, String taxonomyType, String optionValue, int sortOrder) {
        this.tenantId = tenantId;
        this.taxonomyType = taxonomyType;
        this.optionValue = optionValue;
        this.sortOrder = sortOrder;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public String getTaxonomyType() { return taxonomyType; }
    public void setTaxonomyType(String taxonomyType) { this.taxonomyType = taxonomyType; }
    public String getOptionValue() { return optionValue; }
    public void setOptionValue(String optionValue) { this.optionValue = optionValue; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
