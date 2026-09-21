package com.enrollnow.admin.controllers;

import com.enrollnow.admin.dto.*;
import com.enrollnow.admin.services.AdministratorService;
import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/administrator", "/api/administrator"})
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN')")
@Tag(name = "Administration & Governance", description = "Endpoints for user management, RBAC entitlement matrices, location assignments, and audit logging")
@SecurityRequirement(name = "BearerAuth")
public class AdministratorController {

    private final AdministratorService administratorService;

    public AdministratorController(AdministratorService administratorService) {
        this.administratorService = administratorService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get Administration Overview", description = "Retrieves administrative counts of users, roles, sites, and recent events.")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getDashboard() {
        AdminDashboardDto dto = administratorService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/users")
    @Operation(summary = "List Users", description = "Searches and retrieves registered users.")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {

        List<AdminUserDto> users = administratorService.getUsers(search, active);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get User Details")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUser(@PathVariable Long id) {
        AdminUserDto user = administratorService.getUser(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/users")
    @Operation(summary = "Create User Account")
    public ResponseEntity<ApiResponse<AdminUserDto>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminUserDto created = administratorService.createUser(request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", created));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update User Account")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminUserDto updated = administratorService.updateUser(id, request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    @PostMapping("/users/{id}/activate")
    @Operation(summary = "Activate User Account")
    public ResponseEntity<ApiResponse<Void>> activateUser(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        administratorService.activateUser(id, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", null));
    }

    @PostMapping("/users/{id}/deactivate")
    @Operation(summary = "Deactivate User Account")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        administratorService.deactivateUser(id, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", null));
    }

    @PostMapping("/users/{id}/reset-password")
    @Operation(summary = "Reset User Password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        administratorService.resetPassword(id, request.getNewPassword(), currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @GetMapping("/users/{id}/role-assignments")
    @Operation(summary = "Get User Role Assignments")
    public ResponseEntity<ApiResponse<List<UserRoleAssignmentDto>>> getUserRoleAssignments(@PathVariable Long id) {
        List<UserRoleAssignmentDto> assignments = administratorService.getUserRoleAssignments(id);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }

    @PutMapping("/users/{id}/role-assignments")
    @Operation(summary = "Save User Role Assignments")
    public ResponseEntity<ApiResponse<AdminUserDto>> saveUserRoleAssignments(
            @PathVariable Long id,
            @RequestBody List<UserRoleAssignmentDto> assignments,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminUserDto updated = administratorService.saveUserRoleAssignments(id, assignments, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role assignments saved successfully", updated));
    }

    @GetMapping("/users/{id}/locations")
    @Operation(summary = "Get User Clinical Site Scopes")
    public ResponseEntity<ApiResponse<List<AdminSiteAccessDto>>> getUserLocations(@PathVariable Long id) {
        List<AdminSiteAccessDto> locations = administratorService.getUserLocations(id);
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    @PutMapping("/users/{id}/locations")
    @Operation(summary = "Save User Clinical Site Scopes")
    public ResponseEntity<ApiResponse<List<AdminSiteAccessDto>>> saveUserLocations(
            @PathVariable Long id,
            @RequestBody List<Long> locationIds,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        List<AdminSiteAccessDto> updated = administratorService.saveUserLocations(id, locationIds, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Site assignments saved successfully", updated));
    }

    // =========================================================================
    // ROLES & RBAC
    // =========================================================================
    @GetMapping("/roles")
    @Operation(summary = "List Roles")
    public ResponseEntity<ApiResponse<List<AdminRoleDto>>> getRoles() {
        List<AdminRoleDto> roles = administratorService.getRoles();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/roles/{id}")
    @Operation(summary = "Get Role Details")
    public ResponseEntity<ApiResponse<AdminRoleDto>> getRole(@PathVariable Long id) {
        AdminRoleDto role = administratorService.getRole(id);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @PostMapping("/roles")
    @Operation(summary = "Create Role")
    public ResponseEntity<ApiResponse<AdminRoleDto>> createRole(
            @Valid @RequestBody CreateRoleRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminRoleDto created = administratorService.createRole(request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role created successfully", created));
    }

    @PutMapping("/roles/{id}")
    @Operation(summary = "Update Role")
    public ResponseEntity<ApiResponse<AdminRoleDto>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminRoleDto updated = administratorService.updateRole(id, request, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", updated));
    }

    @PatchMapping("/roles/{id}/status")
    @Operation(summary = "Set Role Status")
    public ResponseEntity<ApiResponse<AdminRoleDto>> setRoleStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        AdminRoleDto updated = administratorService.setRoleStatus(id, status, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Role status updated successfully", updated));
    }

    @GetMapping("/roles/{id}/permissions")
    @Operation(summary = "Get Role Navigation Entitlement Matrix")
    public ResponseEntity<ApiResponse<List<PermissionModuleDto>>> getRolePermissions(@PathVariable Long id) {
        List<PermissionModuleDto> modules = administratorService.getRolePermissions(id);
        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    @PutMapping("/roles/{id}/permissions")
    @Operation(summary = "Save Role Navigation Entitlement Matrix")
    public ResponseEntity<ApiResponse<List<PermissionModuleDto>>> saveRolePermissions(
            @PathVariable Long id,
            @RequestBody List<RolePermissionRequest> permissions,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ip = getClientIp(httpRequest);
        List<PermissionModuleDto> updated = administratorService.saveRolePermissions(id, permissions, currentUser.getId(), currentUser.getUsername(), ip);
        return ResponseEntity.ok(ApiResponse.success("Permissions updated successfully", updated));
    }

    @GetMapping("/locations")
    @Operation(summary = "Get Clinical Site Options Dropdown")
    public ResponseEntity<ApiResponse<List<AdminSiteOptionDto>>> getLocations() {
        List<AdminSiteOptionDto> locations = administratorService.getLocations();
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Query Audit Trail Ledger")
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
