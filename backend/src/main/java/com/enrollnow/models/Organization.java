package com.enrollnow.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String name;

    @Column(name = "org_code", nullable = false, unique = true, length = 50)
    private String orgCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Site> sites = new HashSet<>();

    @OneToMany(mappedBy = "organization")
    private Set<User> users = new HashSet<>();

    public Organization() {}

    public Organization(String name, String orgCode, String description) {
        this.name = name;
        this.orgCode = orgCode;
        this.description = description;
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
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOrgCode() { return orgCode; }
    public void setOrgCode(String orgCode) { this.orgCode = orgCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Set<Site> getSites() { return sites; }
    public void setSites(Set<Site> sites) { this.sites = sites; }
    public Set<User> getUsers() { return users; }
    public void setUsers(Set<User> users) { this.users = users; }
}
