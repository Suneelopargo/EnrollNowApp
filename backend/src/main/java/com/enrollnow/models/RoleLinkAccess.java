package com.enrollnow.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "role_link_access", uniqueConstraints = {
    @UniqueConstraint(name = "uq_role_link_access", columnNames = {"role_id", "link_id"})
})
public class RoleLinkAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "link_id", nullable = false)
    private NavigationLink link;

    @Column(name = "can_view", nullable = false)
    private boolean canView = true;

    @Column(name = "can_create", nullable = false)
    private boolean canCreate = false;

    @Column(name = "can_edit", nullable = false)
    private boolean canEdit = false;

    @Column(name = "can_delete", nullable = false)
    private boolean canDelete = false;

    @Column(name = "can_export", nullable = false)
    private boolean canExport = false;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public RoleLinkAccess() {}

    public RoleLinkAccess(Role role, NavigationLink link) {
        this.role = role;
        this.link = link;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = OffsetDateTime.now();
        if (this.updatedAt == null) this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public NavigationLink getLink() { return link; }
    public void setLink(NavigationLink link) { this.link = link; }
    public boolean isCanView() { return canView; }
    public void setCanView(boolean canView) { this.canView = canView; }
    public boolean isCanCreate() { return canCreate; }
    public void setCanCreate(boolean canCreate) { this.canCreate = canCreate; }
    public boolean isCanEdit() { return canEdit; }
    public void setCanEdit(boolean canEdit) { this.canEdit = canEdit; }
    public boolean isCanDelete() { return canDelete; }
    public void setCanDelete(boolean canDelete) { this.canDelete = canDelete; }
    public boolean isCanExport() { return canExport; }
    public void setCanExport(boolean canExport) { this.canExport = canExport; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
