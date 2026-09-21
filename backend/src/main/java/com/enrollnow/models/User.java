package com.enrollnow.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 50)
    private String phone;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserRole> userRoles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserSiteAssignment> siteAssignments = new HashSet<>();

    public User() {}

    public User(String username, String email, String passwordHash, String firstName, String lastName) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
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

    public String getFullName() {
        if (firstName != null && lastName != null) {
            return (firstName + " " + lastName).trim();
        }
        return firstName != null ? firstName : (lastName != null ? lastName : username);
    }

    public void addUserRole(UserRole userRole) {
        if (this.userRoles == null) {
            this.userRoles = new HashSet<>();
        }
        this.userRoles.add(userRole);
        userRole.setUser(this);
    }

    public void addSiteAssignment(UserSiteAssignment assignment) {
        if (this.siteAssignments == null) {
            this.siteAssignments = new HashSet<>();
        }
        this.siteAssignments.add(assignment);
        assignment.setUser(this);
    }

    public List<String> getActiveRoleCodes() {
        List<String> codes = new ArrayList<>();
        for (UserRole ur : userRoles) {
            if (ur.isCurrentlyValid() && ur.getRole() != null && "ACTIVE".equalsIgnoreCase(ur.getRole().getStatus())) {
                codes.add(ur.getRole().getRoleCode());
            }
        }
        return codes;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Set<UserRole> getUserRoles() { return userRoles; }
    public void setUserRoles(Set<UserRole> userRoles) { this.userRoles = userRoles; }
    public Set<UserSiteAssignment> getSiteAssignments() { return siteAssignments; }
    public void setSiteAssignments(Set<UserSiteAssignment> siteAssignments) { this.siteAssignments = siteAssignments; }
}
