package com.enrollnow.admin.dto;

public class AdminDashboardDto {
    private long totalUsers;
    private long activeUsers;
    private long totalRoles;
    private long totalSites;
    private long recentAuditEvents;

    public AdminDashboardDto() {}

    public AdminDashboardDto(long totalUsers, long activeUsers, long totalRoles, long totalSites, long recentAuditEvents) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.totalRoles = totalRoles;
        this.totalSites = totalSites;
        this.recentAuditEvents = recentAuditEvents;
    }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }
    public long getTotalRoles() { return totalRoles; }
    public void setTotalRoles(long totalRoles) { this.totalRoles = totalRoles; }
    public long getTotalSites() { return totalSites; }
    public void setTotalSites(long totalSites) { this.totalSites = totalSites; }
    public long getRecentAuditEvents() { return recentAuditEvents; }
    public void setRecentAuditEvents(long recentAuditEvents) { this.recentAuditEvents = recentAuditEvents; }
}
