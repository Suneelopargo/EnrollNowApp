package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.UserSummaryResponse;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.enrollnow.identity.dtos.AssignRoleRequest;
import com.enrollnow.identity.dtos.CreateUserRequest;
import com.enrollnow.identity.dtos.UpdateUserRequest;

import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserSummaryResponse> getUser(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(
                userService.getUser(tenantId, userId)
        );
    }
    
    @PostMapping
    public ResponseEntity<UserSummaryResponse> createUser(
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateUserRequest request
    ) {

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
        return userService.deactivateUser(tenantId, userId);
    }
    
    @PostMapping("/{userId}/roles")
    public UserRoleAssignment assignRole(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request
    ) {
        return userService.assignRole(
                tenantId,
                userId,
                request
        );
    }
}