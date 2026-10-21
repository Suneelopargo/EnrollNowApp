package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.AssignRoleRequest;
import com.enrollnow.identity.dtos.CreateUserRequest;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.dtos.UserSummaryResponse;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.identity.services.UserInvitationService;
import com.enrollnow.identity.services.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users")
public class UserController {

    private final UserService userService;
    private final UserInvitationService userInvitationService;
    private final SitePermissionService sitePermissionService;
    private final SiteAuthorizationService siteAuthorizationService;

    public UserController(
            UserService userService,
            UserInvitationService userInvitationService) {
        this(userService, userInvitationService, null, null);
    }

    @Autowired
    public UserController(
            UserService userService,
            UserInvitationService userInvitationService,
            SitePermissionService sitePermissionService,
            SiteAuthorizationService siteAuthorizationService) {

        this.userService = userService;
        this.userInvitationService = userInvitationService;
        this.sitePermissionService = sitePermissionService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    public ResponseEntity<UserSummaryResponse> getUser(
            UUID tenantId,
            UUID userId
    ) {
        return getUser(tenantId, userId, null);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserSummaryResponse> getUser(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @RequestParam(value = "siteId", required = false) UUID siteId
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireSelfOrUserViewAccess(tenantId, userId, siteId);
        }
        return ResponseEntity.ok(
                userService.getUser(tenantId, userId, siteId)
        );
    }

    @GetMapping("/{userId}/permissions")
    public ResponseEntity<UserEffectivePermissionsResponse> getUserPermissions(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @RequestParam(value = "siteId", required = false) UUID siteId
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireSelfOrUserViewAccess(tenantId, userId, siteId);
        }
        userService.getUser(tenantId, userId, siteId);
        UserEffectivePermissionsResponse permissions = sitePermissionService != null
                ? sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteId)
                : new UserEffectivePermissionsResponse();
        return ResponseEntity.ok(permissions);
    }

    @PostMapping
    public ResponseEntity<UserSummaryResponse> createUser(
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateUserRequest request
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireUserManageAccess(tenantId, null);
        }

        UserSummaryResponse createdUser =
                userService.createUser(tenantId, request);

        return ResponseEntity
                .status(201)
                .body(createdUser);
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> getUsers(
            @PathVariable UUID tenantId
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireSiteAdminAccess(tenantId, null);
        }
        return ResponseEntity.ok(
                userService.getUsers(tenantId)
        );
    }

    @PutMapping("/{userId}")
    public UserSummaryResponse updateUser(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireUserManageAccess(tenantId, null);
        }
        return userService.updateUser(
                tenantId,
                userId,
                request
        );
    }

    @PutMapping("/{userId}/deactivate")
    public UserSummaryResponse deactivateUser(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireUserManageAccess(tenantId, null);
        }
        return userService.deactivateUser(tenantId, userId);
    }

    @PutMapping("/{userId}/activate")
    public UserSummaryResponse activateUser(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireUserManageAccess(tenantId, null);
        }
        return userService.activateUser(tenantId, userId);
    }

    @PostMapping("/{userId}/roles")
    public UserRoleAssignment assignRole(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireRoleAssignmentAuthorization(
                    tenantId,
                    userId,
                    request.getRoleCode(),
                    request.getScopeType(),
                    request.getScopeId()
            );
        }
        return userService.assignRole(
                tenantId,
                userId,
                request
        );
    }

    @PostMapping("/{userId}/send-invitation")
    public ResponseEntity<?> sendInvitation(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireUserManageAccess(tenantId, null);
        }

        userInvitationService.sendInvitation(
                tenantId,
                userId
        );

        return ResponseEntity.ok(
                java.util.Map.of(
                        "message",
                        "Invitation sent successfully."
                )
        );
    }

    public ResponseEntity<Void> removeSiteRole(
            UUID tenantId,
            UUID userId
    ) {
        return removeSiteRole(tenantId, userId, null);
    }

    @DeleteMapping("/{userId}/roles/site")
    public ResponseEntity<Void> removeSiteRole(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @RequestParam(value = "siteId", required = false) UUID siteId
    ) {
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireSiteRoleRemovalAuthorization(tenantId, userId, siteId);
        }
        userService.removeSiteRole(tenantId, userId, siteId);
        return ResponseEntity.noContent().build();
    }
}