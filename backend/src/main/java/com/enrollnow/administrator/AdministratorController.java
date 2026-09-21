package com.enrollnow.administrator;

import com.enrollnow.administrator.dto.*;
import com.enrollnow.common.ApiResponse;
import com.enrollnow.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administrator")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN')")
public class AdministratorController {

    private final AdministratorService administratorService;

    public AdministratorController(AdministratorService administratorService) {
        this.administratorService = administratorService;
    }

    // =========================================================================
    // DASHBOARD
    // =========================================================================
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getDashboard() {
        AdminDashboardDto dto = administratorService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // =========================================================================
    // USERS
    // =========================================================================
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {

        List<AdminUserDto> users = administratorService.getUsers(search, active);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUser(@PathVariable Long id) {
        AdminUserDto user = administratorService.getUser(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserDto>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminUserDto created = administratorService.createUser(request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", created));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminUserDto updated = administratorService.updateUser(id, request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    @PostMapping("/users/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        administratorService.activateUser(id, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", null));
    }

    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        administratorService.deactivateUser(id, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", null));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        administratorService.resetPassword(id, request.getNewPassword(), currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @GetMapping("/users/{id}/role-assignments")
    public ResponseEntity<ApiResponse<List<UserRoleAssignmentDto>>> getUserRoleAssignments(@PathVariable Long id) {
        List<UserRoleAssignmentDto> assignments = administratorService.getUserRoleAssignments(id);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }

    @PutMapping("/users/{id}/role-assignments")
    public ResponseEntity<ApiResponse<AdminUserDto>> saveUserRoleAssignments(
            @PathVariable Long id,
            @RequestBody List<UserRoleAssignmentDto> assignments,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminUserDto updated = administratorService.saveUserRoleAssignments(id, assignments, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role assignments saved successfully", updated));
    }

    @GetMapping("/users/{id}/locations")
    public ResponseEntity<ApiResponse<List<AdminSiteAccessDto>>> getUserLocations(@PathVariable Long id) {
        List<AdminSiteAccessDto> locations = administratorService.getUserLocations(id);
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    @PutMapping("/users/{id}/locations")
    public ResponseEntity<ApiResponse<List<AdminSiteAccessDto>>> saveUserLocations(
            @PathVariable Long id,
            @RequestBody List<Long> locationIds,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        List<AdminSiteAccessDto> updated = administratorService.saveUserLocations(id, locationIds, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Site assignments saved successfully", updated));
    }

    // =========================================================================
    // ROLES & RBAC
    // =========================================================================
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<AdminRoleDto>>> getRoles() {
        List<AdminRoleDto> roles = administratorService.getRoles();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/roles/{id}")
    public ResponseEntity<ApiResponse<AdminRoleDto>> getRole(@PathVariable Long id) {
        AdminRoleDto role = administratorService.getRole(id);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @PostMapping("/roles")
    public ResponseEntity<ApiResponse<AdminRoleDto>> createRole(
            @Valid @RequestBody CreateRoleRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminRoleDto created = administratorService.createRole(request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role created successfully", created));
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<ApiResponse<AdminRoleDto>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminRoleDto updated = administratorService.updateRole(id, request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", updated));
    }

    @PatchMapping("/roles/{id}/status")
    public ResponseEntity<ApiResponse<AdminRoleDto>> setRoleStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminRoleDto updated = administratorService.setRoleStatus(id, status, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role status updated successfully", updated));
    }

    @GetMapping("/roles/{id}/permissions")
    public ResponseEntity<ApiResponse<List<PermissionModuleDto>>> getRolePermissions(@PathVariable Long id) {
        List<PermissionModuleDto> modules = administratorService.getRolePermissions(id);
        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    @PutMapping("/roles/{id}/permissions")
    public ResponseEntity<ApiResponse<List<PermissionModuleDto>>> saveRolePermissions(
            @PathVariable Long id,
            @RequestBody List<RolePermissionRequest> permissions,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        List<PermissionModuleDto> updated = administratorService.saveRolePermissions(id, permissions, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Permissions updated successfully", updated));
    }

    // =========================================================================
    // LOCATIONS (SITES)
    // =========================================================================
    @GetMapping("/locations")
    public ResponseEntity<ApiResponse<List<AdminSiteOptionDto>>> getLocations() {
        List<AdminSiteOptionDto> locations = administratorService.getLocations();
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<AdminAuditPageDto>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) Long targetUserId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        AdminAuditPageDto logs = administratorService.getAuditLogs(action, performedBy, targetUserId, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
