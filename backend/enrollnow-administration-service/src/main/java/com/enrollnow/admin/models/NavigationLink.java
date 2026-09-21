package com.enrollnow.admin.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "navigation_links")
public class NavigationLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
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
    private int displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public NavigationLink() {}

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

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
