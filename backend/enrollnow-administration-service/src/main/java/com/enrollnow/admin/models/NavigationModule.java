package com.enrollnow.admin.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "navigation_modules")
public class NavigationModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "module_code", nullable = false, unique = true, length = 50)
    private String moduleCode;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "short_title", length = 50)
    private String shortTitle;

    @Column(length = 50)
    private String icon = "Folder";

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<NavigationLink> links = new ArrayList<>();

    public NavigationModule() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getModuleCode() { return moduleCode; }
    public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getShortTitle() { return shortTitle; }
    public void setShortTitle(String shortTitle) { this.shortTitle = shortTitle; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public List<NavigationLink> getLinks() { return links; }
    public void setLinks(List<NavigationLink> links) { this.links = links; }
}
