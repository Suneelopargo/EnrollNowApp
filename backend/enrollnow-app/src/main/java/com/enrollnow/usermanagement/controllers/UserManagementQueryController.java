package com.enrollnow.usermanagement.controllers;

import com.enrollnow.usermanagement.dtos.UserListItemResponse;
import com.enrollnow.usermanagement.services.UserManagementQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users")
public class UserManagementQueryController {

    private final UserManagementQueryService userManagementQueryService;

    public UserManagementQueryController(
            UserManagementQueryService userManagementQueryService) {
        this.userManagementQueryService = userManagementQueryService;
    }

    @GetMapping("/details")
    public ResponseEntity<List<UserListItemResponse>> getUsers(
            @PathVariable UUID tenantId) {

        return ResponseEntity.ok(
                userManagementQueryService.getUsers(tenantId)
        );
    }
}