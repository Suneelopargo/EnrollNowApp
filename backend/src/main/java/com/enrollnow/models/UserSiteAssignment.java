package com.enrollnow.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_site_assignments", uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_site", columnNames = {"user_id", "site_id"})
})
public class UserSiteAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UserSiteAssignment() {}

    public UserSiteAssignment(User user, Site site) {
        this.user = user;
        this.site = site;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Site getSite() { return site; }
    public void setSite(Site site) { this.site = site; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
