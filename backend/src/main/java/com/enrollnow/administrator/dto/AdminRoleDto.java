package com.enrollnow.administrator.dto;

import java.time.OffsetDateTime;

public class AdminRoleDto {

    private Long id;
    private String name;
    private String roleCode;
    private String description;
    private String status;
    private long userCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public AdminRoleDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRoleCode() { return roleCode; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getUserCount() { return userCount; }
    public void setUserCount(long userCount) { this.userCount = userCount; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
