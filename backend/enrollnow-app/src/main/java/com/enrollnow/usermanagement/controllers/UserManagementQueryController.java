package com.enrollnow.usermanagement.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.usermanagement.dtos.UserListItemResponse;
import com.enrollnow.usermanagement.services.UserManagementQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users")
public class UserManagementQueryController {

    private final UserManagementQueryService userManagementQueryService;
    private final SiteAuthorizationService siteAuthorizationService;

    public UserManagementQueryController(
            UserManagementQueryService userManagementQueryService) {
        this(userManagementQueryService, null);
    }

    @Autowired
    public UserManagementQueryController(
            UserManagementQueryService userManagementQueryService,
            SiteAuthorizationService siteAuthorizationService) {
        this.userManagementQueryService = userManagementQueryService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    public ResponseEntity<List<UserListItemResponse>> getUsers(UUID tenantId) {
        return getUsers(tenantId, null);
    }

    @GetMapping("/details")
    public ResponseEntity<List<UserListItemResponse>> getUsers(
            @PathVariable UUID tenantId,
            @RequestParam(value = "siteId", required = false) UUID siteId) {

        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireSiteAdminAccess(tenantId, siteId);
        }

        return ResponseEntity.ok(
                userManagementQueryService.getUsers(tenantId, siteId)
        );
    }
}