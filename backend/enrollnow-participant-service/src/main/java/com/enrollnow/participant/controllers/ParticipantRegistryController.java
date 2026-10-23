package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantRegistryService;
import com.enrollnow.participant.services.RegistryExportService;
import com.enrollnow.participant.services.RegistrySavedSearchService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class ParticipantRegistryController {

    private static final Logger log = LoggerFactory.getLogger(ParticipantRegistryController.class);
    private static final UUID DEFAULT_TENANT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DEFAULT_USER_ID = UUID.fromString("4e1941de-e712-4fe0-b0ea-845094e86349");

    private final ParticipantRegistryService registryService;
    private final RegistrySavedSearchService savedSearchService;
    private final RegistryExportService exportService;
    private final SiteAuthorizationService siteAuthorizationService;
    private final ObjectMapper objectMapper;

    public ParticipantRegistryController(
            ParticipantRegistryService registryService,
            RegistrySavedSearchService savedSearchService,
            RegistryExportService exportService,
            SiteAuthorizationService siteAuthorizationService,
            ObjectMapper objectMapper) {
        this.registryService = registryService;
        this.savedSearchService = savedSearchService;
        this.exportService = exportService;
        this.siteAuthorizationService = siteAuthorizationService;
        this.objectMapper = objectMapper;
    }

    private UUID resolveTenantId(UUID queryTenantId) {
        if (queryTenantId != null) {
            siteAuthorizationService.requireTenantMatch(queryTenantId);
            return queryTenantId;
        }
        Optional<SiteAuthorizationService.CallerIdentity> caller = siteAuthorizationService.getAuthenticatedCaller();
        if (caller.isPresent() && caller.get().tenantId() != null) {
            return caller.get().tenantId();
        }
        return DEFAULT_TENANT_ID;
    }

    private UUID resolveUserId() {
        Optional<SiteAuthorizationService.CallerIdentity> caller = siteAuthorizationService.getAuthenticatedCaller();
        if (caller.isPresent()) {
            return caller.get().userId();
        }
        return DEFAULT_USER_ID;
    }

    @GetMapping("/participants")
    public ResponseEntity<RegistryPagedResponse<RegistryParticipantDto>> getParticipants(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false, defaultValue = "all") String contactFilter,
            @RequestParam(required = false, defaultValue = "all") String availableFilter,
            @RequestParam(required = false) List<String> studies,
            @RequestParam(required = false) String customFiltersJson,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "25") int pageSize,
            @RequestParam(required = false, defaultValue = "name") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDirection) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        String effectiveSearch = searchTerm != null ? searchTerm : search;

        List<CustomFilterRuleDto> rules = new ArrayList<>();
        if (customFiltersJson != null && !customFiltersJson.isBlank()) {
            try {
                rules = objectMapper.readValue(customFiltersJson, new TypeReference<List<CustomFilterRuleDto>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse customFiltersJson: {}", customFiltersJson);
            }
        }

        RegistryPagedResponse<RegistryParticipantDto> response = registryService.searchParticipants(
                resolvedTenantId,
                siteId,
                effectiveSearch,
                contactFilter,
                availableFilter,
                studies,
                rules,
                page,
                pageSize,
                sortBy,
                sortDirection
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/participants/check-duplicate")
    public ResponseEntity<List<RegistryParticipantDto>> checkDuplicate(
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        List<RegistryParticipantDto> duplicates = registryService.findDuplicatesByName(resolvedTenantId, firstName, lastName);
        return ResponseEntity.ok(duplicates);
    }

    @GetMapping("/participants/{id}")
    public ResponseEntity<RegistryParticipantDto> getParticipant(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return registryService.getParticipantById(resolvedTenantId, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/participants")
    public ResponseEntity<RegistryParticipantDto> createParticipant(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestBody CreateParticipantRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        RegistryParticipantDto created = registryService.createParticipant(resolvedTenantId, siteId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/participants/{id}")
    public ResponseEntity<RegistryParticipantDto> updateParticipant(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestBody UpdateParticipantRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        RegistryParticipantDto updated = registryService.updateParticipant(resolvedTenantId, id, userId, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/participants/{id}/status")
    public ResponseEntity<Void> updateParticipantStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestBody Map<String, String> body) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        registryService.updateParticipantStatus(resolvedTenantId, id, userId, status);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/participants/{id}")
    public ResponseEntity<Void> deleteParticipant(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        registryService.deleteParticipant(resolvedTenantId, id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/participants/assign-study")
    public ResponseEntity<Void> assignStudy(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestBody AssignStudyRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        registryService.assignStudy(resolvedTenantId, userId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/registry/saved-searches")
    public ResponseEntity<List<SavedSearchDto>> getSavedSearches(
            @RequestParam(required = false) UUID tenantId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);
        UUID userId = resolveUserId();

        List<SavedSearchDto> list = savedSearchService.getSavedSearches(resolvedTenantId, userId);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/registry/saved-searches")
    public ResponseEntity<SavedSearchDto> createSavedSearch(
            @RequestParam(required = false) UUID tenantId,
            @Valid @RequestBody CreateSavedSearchRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);
        UUID userId = resolveUserId();

        SavedSearchDto created = savedSearchService.createSavedSearch(resolvedTenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/registry/saved-searches/{id}")
    public ResponseEntity<Void> deleteSavedSearch(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID tenantId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);
        UUID userId = resolveUserId();

        savedSearchService.deleteSavedSearch(resolvedTenantId, userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/registry/export")
    public ResponseEntity<byte[]> exportRegistry(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false, defaultValue = "all") String contactFilter,
            @RequestParam(required = false, defaultValue = "all") String availableFilter,
            @RequestParam(required = false) List<String> studies,
            @RequestParam(required = false) String customFiltersJson) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        String effectiveSearch = searchTerm != null ? searchTerm : search;

        List<CustomFilterRuleDto> rules = new ArrayList<>();
        if (customFiltersJson != null && !customFiltersJson.isBlank()) {
            try {
                rules = objectMapper.readValue(customFiltersJson, new TypeReference<List<CustomFilterRuleDto>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse customFiltersJson for export: {}", customFiltersJson);
            }
        }

        List<RegistryParticipantDto> matching = registryService.getAllMatchingParticipants(
                resolvedTenantId, siteId, effectiveSearch, contactFilter, availableFilter, studies, rules);

        byte[] csvData = exportService.exportToCsv(matching);

        String filename = "registry_export_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
