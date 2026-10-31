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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class ParticipantRegistryController {

    private static final Logger log = LoggerFactory.getLogger(ParticipantRegistryController.class);
    private static final Set<String> EXPORT_FIELD_KEYS = Set.of(
            "globalId", "firstName", "middleName", "lastName", "gender", "age", "demographics.dob",
            "demographics.race", "demographics.ethnicity", "contactForFutureStudies", "familyId", "tags",
            "dateCreated", "phone", "contactMethods.primaryEmail", "contactMethods.address", "city", "state", "zipcode",
            "section.comments", "section.contacts", "section.contactLogs", "section.emailLogs", "section.consentLogs"
    );

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
        siteAuthorizationService.requireTenantMatch(queryTenantId);
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to access Registry resources"));
        if (caller.tenantId() == null) {
            throw new AccessDeniedException("Authenticated caller is not associated with any tenant");
        }
        if (queryTenantId != null && !caller.tenantId().equals(queryTenantId)) {
            throw new AccessDeniedException("Access denied: cross-tenant operation is not permitted");
        }
        return caller.tenantId();
    }

    private UUID resolveUserId() {
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to access Registry resources"));
        if (caller.userId() != null) {
            return caller.userId();
        }
        throw new AccessDeniedException("Authenticated caller has no user ID");
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
            @RequestParam(required = false, defaultValue = "false") boolean duplicatesOnly,
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
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed customFilters parameter: invalid JSON");
            }
            rules = registryService.removeUnfinishedFilterRules(rules);
            registryService.validateFilterRules(resolvedTenantId, rules);
        }

        RegistryPagedResponse<RegistryParticipantDto> response = registryService.searchParticipants(
                resolvedTenantId,
                siteId,
                effectiveSearch,
                contactFilter,
                availableFilter,
                studies,
                rules,
                duplicatesOnly,
                page,
                pageSize,
                sortBy,
                sortDirection
        );

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<RegistryPagedResponse<RegistryParticipantDto>> getParticipants(
            UUID tenantId,
            UUID siteId,
            String search,
            String searchTerm,
            String contactFilter,
            String availableFilter,
            List<String> studies,
            String customFiltersJson,
            int page,
            int pageSize,
            String sortBy,
            String sortDirection) {
        return getParticipants(tenantId, siteId, search, searchTerm, contactFilter, availableFilter, studies, customFiltersJson, false, page, pageSize, sortBy, sortDirection);
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

        RegistryParticipantDto updated = registryService.updateParticipant(resolvedTenantId, id, userId, request, siteId);
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

    @GetMapping({"/registry/timezone-options", "/registry/timezones"})
    public ResponseEntity<List<String>> getTimezoneOptions(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(registryService.getTimezoneOptions());
    }

    @GetMapping("/registry/demographic-options")
    public ResponseEntity<Map<String, List<String>>> getDemographicOptions(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(registryService.getDemographicOptions(resolvedTenantId));
    }

    @GetMapping("/registry/filter-options")
    public ResponseEntity<Map<String, List<String>>> getRegistryFilterOptions(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(registryService.getRegistryFilterOptions(resolvedTenantId, siteId));
    }

    @GetMapping("/registry/relationship-options")
    public ResponseEntity<List<String>> getRelationshipOptions(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(registryService.getRelationshipOptions());
    }
    @GetMapping("/registry/filter-metadata")
    public ResponseEntity<List<Map<String, Object>>> getFilterMetadata(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) String studyId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);

        List<Map<String, Object>> metadata = registryService.getFilterMetadata(resolvedTenantId, studyId);
        return ResponseEntity.ok(metadata);
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

    @GetMapping("/registry/participant-tags")
    public ResponseEntity<List<String>> getParticipantTags(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "20") int limit,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        List<String> tags = registryService.getParticipantTags(resolvedTenantId, siteId, search, limit);
        return ResponseEntity.ok(tags);
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
            @RequestParam(required = false) String customFiltersJson,
            @RequestParam(required = false, defaultValue = "false") boolean duplicatesOnly,
            @RequestParam(required = false) List<String> exportFields,
            @RequestParam(required = false) String timezone) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        String effectiveSearch = searchTerm != null ? searchTerm : search;

        List<CustomFilterRuleDto> rules = new ArrayList<>();
        if (customFiltersJson != null && !customFiltersJson.isBlank()) {
            try {
                rules = objectMapper.readValue(customFiltersJson, new TypeReference<List<CustomFilterRuleDto>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse customFiltersJson for export: {}", customFiltersJson);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed customFilters parameter: invalid JSON");
            }
            rules = registryService.removeUnfinishedFilterRules(rules);
            registryService.validateFilterRules(resolvedTenantId, rules);
        }

        if (timezone != null && !timezone.isBlank()) {
            try {
                java.time.ZoneId.of(timezone);
            } catch (java.time.DateTimeException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid timezone: " + timezone);
            }
        }

        List<RegistryParticipantDto> matching = registryService.getAllMatchingParticipants(
                resolvedTenantId, siteId, effectiveSearch, contactFilter, availableFilter, studies, rules, duplicatesOnly);

        byte[] csvData = exportFields == null && (timezone == null || timezone.isBlank())
                ? exportService.exportToCsv(matching)
                : exportService.exportToCsv(matching, exportFields, timezone, resolvedTenantId);

        String filename = "registry_export_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @PostMapping(value = "/registry/export", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> exportRegistry(@RequestBody RegistryExportRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Export request body is required");
        }
        validateExportFields(request.getExportFields());
        return exportRegistry(
                request.getTenantId(), request.getSiteId(), request.getSearch(), request.getSearchTerm(),
                request.getContactFilter(), request.getAvailableFilter(), request.getStudies(),
                request.getCustomFiltersJson(), request.isDuplicatesOnly(), request.getExportFields(), request.getTimezone());
    }

    private void validateExportFields(List<String> fields) {
        if (fields == null || fields.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one export field");
        }
        if (fields.size() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many export fields selected");
        }
        boolean invalidField = fields.stream().anyMatch(field -> field == null ||
                (!EXPORT_FIELD_KEYS.contains(field) && (!field.startsWith("variables.") || field.length() <= "variables.".length())));
        if (invalidField) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The export contains an unsupported field");
        }
    }

    public ResponseEntity<byte[]> exportRegistry(
            UUID tenantId,
            UUID siteId,
            String search,
            String searchTerm,
            String contactFilter,
            String availableFilter,
            List<String> studies,
            String customFiltersJson) {
        return exportRegistry(tenantId, siteId, search, searchTerm, contactFilter, availableFilter, studies, customFiltersJson, false, null, null);
    }
}
