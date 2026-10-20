package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.GeneralSettingsDto;
import com.enrollnow.identity.services.GeneralSettingsService;
import com.enrollnow.identity.services.SiteAuthorizationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/tenants/{tenantId}/general-settings", "/api/v1/general-settings"})
public class GeneralSettingsController {

    private final GeneralSettingsService generalSettingsService;
    private final SiteAuthorizationService siteAuthorizationService;

    public GeneralSettingsController(
            GeneralSettingsService generalSettingsService,
            SiteAuthorizationService siteAuthorizationService) {
        this.generalSettingsService = generalSettingsService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @GetMapping
    public ResponseEntity<GeneralSettingsDto> getGeneralSettings(
            @PathVariable(name = "tenantId", required = false) UUID tenantId) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        return ResponseEntity.ok(generalSettingsService.getGeneralSettings(effectiveTenantId));
    }

    @PutMapping
    public ResponseEntity<GeneralSettingsDto> updateGeneralSettings(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @Valid @RequestBody GeneralSettingsDto dto) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        return ResponseEntity.ok(generalSettingsService.updateGeneralSettings(effectiveTenantId, dto));
    }

    private UUID resolveTenantId(UUID pathTenantId) {
        if (pathTenantId != null) {
            return pathTenantId;
        }
        return siteAuthorizationService.getAuthenticatedCaller()
                .map(SiteAuthorizationService.CallerIdentity::tenantId)
                .orElseThrow(() -> new AccessDeniedException("Access denied: tenant context is required"));
    }
}
