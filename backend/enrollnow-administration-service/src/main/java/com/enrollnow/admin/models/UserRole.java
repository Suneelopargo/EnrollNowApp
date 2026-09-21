package com.enrollnow.admin.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_roles", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_role", columnNames = {"user_id", "role_id"})
})
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "valid_from")
    private OffsetDateTime validFrom = OffsetDateTime.now();

    @Column(name = "valid_until")
    private OffsetDateTime validUntil;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public UserRole() {}

    public UserRole(Long userId, Role role) {
        this.userId = userId;
        this.role = role;
        this.status = "ACTIVE";
        this.validFrom = OffsetDateTime.now();
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public OffsetDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(OffsetDateTime validFrom) { this.validFrom = validFrom; }

    public OffsetDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(OffsetDateTime validUntil) { this.validUntil = validUntil; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
