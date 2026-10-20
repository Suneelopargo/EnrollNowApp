package com.enrollnow.registry.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.services.SiteAuthorizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class RegistryParticipantController {

    private final SiteAuthorizationService siteAuthorizationService;
    private final SiteRepository siteRepository;

    public RegistryParticipantController(
            SiteAuthorizationService siteAuthorizationService,
            SiteRepository siteRepository
    ) {
        this.siteAuthorizationService = siteAuthorizationService;
        this.siteRepository = siteRepository;
    }

    @GetMapping("/participants")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParticipants(
            @RequestParam(value = "tenantId", required = false) UUID tenantId,
            @RequestParam(value = "siteId", required = false) UUID siteId
    ) {
        siteAuthorizationService.requireRegistryAccess(tenantId, siteId);
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
    }

    @GetMapping("/participants/{participantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getParticipant(
            @PathVariable String participantId,
            @RequestParam(value = "tenantId", required = false) UUID tenantId,
            @RequestParam(value = "siteId", required = false) UUID siteId
    ) {
        siteAuthorizationService.requireRegistryAccess(tenantId, siteId);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", participantId);
        payload.put("participantId", participantId);
        payload.put("status", "ACTIVE");
        return ResponseEntity.ok(ApiResponse.success(payload));
    }

    @PatchMapping("/participants/{participantId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateParticipantStatus(
            @PathVariable String participantId,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(value = "tenantId", required = false) UUID tenantId,
            @RequestParam(value = "siteId", required = false) UUID siteId
    ) {
        siteAuthorizationService.requireRegistryAccess(tenantId, siteId);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", participantId);
        payload.put("participantId", participantId);
        payload.put("status", body != null && body.get("status") != null ? String.valueOf(body.get("status")) : "ACTIVE");
        return ResponseEntity.ok(ApiResponse.success(payload));
    }

    @GetMapping("/sites")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSites(
            @RequestParam(value = "tenantId", required = false) UUID tenantId
    ) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        Optional<SiteAuthorizationService.CallerIdentity> callerOpt = siteAuthorizationService.getAuthenticatedCaller();
        UUID effectiveTenantId = tenantId != null
                ? tenantId
                : callerOpt.map(SiteAuthorizationService.CallerIdentity::tenantId).orElse(null);

        List<Site> sites = effectiveTenantId != null
                ? siteRepository.findByTenantIdAndActiveTrue(effectiveTenantId)
                : Collections.emptyList();

        List<Map<String, Object>> result = sites.stream().map(site -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", site.getId());
            item.put("siteCode", site.getSiteCode());
            item.put("name", site.getName());
            item.put("status", site.isActive() ? "ACTIVE" : "INACTIVE");
            return item;
        }).toList();

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
