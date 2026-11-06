package com.enrollnow.usermanagement.controllers;

import com.enrollnow.identity.dtos.UserSummaryResponse;
import com.enrollnow.usermanagement.dtos.CreateUserAccessRequest;
import com.enrollnow.usermanagement.dtos.UpdateUserAccessRequest;
import com.enrollnow.usermanagement.services.UserAccessOrchestrationService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;


@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users")
public class UserManagementController {

    private final UserAccessOrchestrationService orchestrationService;

    public UserManagementController(
            UserAccessOrchestrationService orchestrationService
    ) {
        this.orchestrationService = orchestrationService;
    }

    @PutMapping("/{userId}/access")
    public ResponseEntity<Void> updateUserAccess(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserAccessRequest request
    ) {

        orchestrationService.updateUserAccess(
                tenantId,
                userId,
                request
        );

        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/with-access")
    public ResponseEntity<UserSummaryResponse> createUserWithAccess(
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateUserAccessRequest request
    ) {

        UserSummaryResponse created =
                orchestrationService.createUserWithAccess(
                        tenantId,
                        request
                );

        return ResponseEntity
                .status(201)
                .body(created);
    }
}