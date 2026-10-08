package com.enrollnow.identity.models;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
    name = "role_permissions",
    schema = "enrollnow"
)
public class RolePermission {

    @EmbeddedId
    private RolePermissionId id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public RolePermissionId getId() {
        return id;
    }

    public void setId(RolePermissionId id) {
        this.id = id;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}