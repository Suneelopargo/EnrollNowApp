package com.enrollnow.usermanagement.controllers;

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
}