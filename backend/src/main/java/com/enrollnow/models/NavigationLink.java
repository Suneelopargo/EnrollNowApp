package com.enrollnow.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "navigation_links")
public class NavigationLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", nullable = false)
    private NavigationModule module;

    @Column(name = "link_code", nullable = false, unique = true, length = 60)
    private String linkCode;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 200)
    private String path;

    @Column(length = 50)
    private String icon = "FileText";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "link", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoleLinkAccess> roleAccessList = new ArrayList<>();

    public NavigationLink() {}

    public NavigationLink(NavigationModule module, String linkCode, String title, String path, String icon, Integer displayOrder) {
        this.module = module;
        this.linkCode = linkCode;
        this.title = title;
        this.path = path;
        this.icon = icon;
        this.displayOrder = displayOrder;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public NavigationModule getModule() { return module; }
    public void setModule(NavigationModule module) { this.module = module; }
    public String getLinkCode() { return linkCode; }
    public void setLinkCode(String linkCode) { this.linkCode = linkCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public List<RoleLinkAccess> getRoleAccessList() { return roleAccessList; }
    public void setRoleAccessList(List<RoleLinkAccess> roleAccessList) { this.roleAccessList = roleAccessList; }
}
