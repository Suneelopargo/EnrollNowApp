package com.enrollnow.administrator.dto;

import java.util.List;
import java.util.Map;

public class AdminDashboardDto {

    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long adminUsers;
    private long activeLocations;
    private List<Map<String, Object>> usersByRole;
    private List<Map<String, Object>> usersByLocation;
    private List<AdminAuditLogDto> recentActivity;

    public AdminDashboardDto() {}

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }
    public long getInactiveUsers() { return inactiveUsers; }
    public void setInactiveUsers(long inactiveUsers) { this.inactiveUsers = inactiveUsers; }
    public long getAdminUsers() { return adminUsers; }
    public void setAdminUsers(long adminUsers) { this.adminUsers = adminUsers; }
    public long getActiveLocations() { return activeLocations; }
    public void setActiveLocations(long activeLocations) { this.activeLocations = activeLocations; }
    public List<Map<String, Object>> getUsersByRole() { return usersByRole; }
    public void setUsersByRole(List<Map<String, Object>> usersByRole) { this.usersByRole = usersByRole; }
    public List<Map<String, Object>> getUsersByLocation() { return usersByLocation; }
    public void setUsersByLocation(List<Map<String, Object>> usersByLocation) { this.usersByLocation = usersByLocation; }
    public List<AdminAuditLogDto> getRecentActivity() { return recentActivity; }
    public void setRecentActivity(List<AdminAuditLogDto> recentActivity) { this.recentActivity = recentActivity; }
}
