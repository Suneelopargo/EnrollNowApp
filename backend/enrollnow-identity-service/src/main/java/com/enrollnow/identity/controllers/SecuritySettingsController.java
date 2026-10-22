package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.PasswordPolicyDto;
import com.enrollnow.identity.dtos.SecuritySettingsDto;
import com.enrollnow.identity.services.SecuritySettingsService;
import com.enrollnow.identity.services.SiteAuthorizationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/tenants/{tenantId}/security-settings", "/api/v1/security-settings"})
public class SecuritySettingsController {

    private final SecuritySettingsService securitySettingsService;
    private final SiteAuthorizationService siteAuthorizationService;

    public SecuritySettingsController(
            SecuritySettingsService securitySettingsService,
            SiteAuthorizationService siteAuthorizationService) {
        this.securitySettingsService = securitySettingsService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @GetMapping
    public ResponseEntity<SecuritySettingsDto> getSecuritySettings(
            @PathVariable(name = "tenantId", required = false) UUID tenantId) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        return ResponseEntity.ok(securitySettingsService.getSecuritySettings(effectiveTenantId));
    }

    @GetMapping("/password-policy")
    public ResponseEntity<PasswordPolicyDto> getPasswordPolicy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId) {
        return ResponseEntity.ok(securitySettingsService.getPublicPasswordPolicy(tenantId));
    }

    @PutMapping
    public ResponseEntity<SecuritySettingsDto> updateSecuritySettings(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @Valid @RequestBody SecuritySettingsDto dto) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        return ResponseEntity.ok(securitySettingsService.updateSecuritySettings(effectiveTenantId, dto));
    }

    @PostMapping("/reset-defaults")
    public ResponseEntity<SecuritySettingsDto> resetToDefaults(
            @PathVariable(name = "tenantId", required = false) UUID tenantId) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        return ResponseEntity.ok(securitySettingsService.resetToDefaults(effectiveTenantId));
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
