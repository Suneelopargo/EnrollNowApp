package com.enrollnow.participant.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.RegistryContextService;
import com.enrollnow.participant.services.RegistrySearchService;
import com.enrollnow.participant.services.RegistryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/registry")
public class RegistryController {
    private final RegistryService registryService;
    private final RegistrySearchService searchService;
    private final RegistryContextService contextService;

    public RegistryController(RegistryService registryService,
                              RegistrySearchService searchService,
                              RegistryContextService contextService) {
        this.registryService = registryService;
        this.searchService = searchService;
        this.contextService = contextService;
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<RegistrySearchResponse>> search(
            @Valid @RequestBody RegistrySearchRequest request,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        UUID resolvedTenant = contextService.resolveTenantId(tenantId);
        return ResponseEntity.ok(ApiResponse.success(searchService.search(resolvedTenant, request)));
    }

    @GetMapping("/filter-options")
    public ResponseEntity<ApiResponse<RegistryFilterOptionsResponse>> getFilterOptions(
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        UUID resolvedTenant = contextService.resolveTenantId(tenantId);
        return ResponseEntity.ok(ApiResponse.success(registryService.getFilterOptions(resolvedTenant)));
    }

    @GetMapping("/saved-searches")
    public ResponseEntity<ApiResponse<List<SavedRegistrySearchResponse>>> getSavedSearches(
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(registryService.getSavedSearches(
                contextService.resolveTenantId(tenantId), contextService.resolveUserId(userId))));
    }

    @PostMapping("/saved-searches")
    public ResponseEntity<ApiResponse<SavedRegistrySearchResponse>> saveSearch(
            @Valid @RequestBody SavedRegistrySearchRequest request,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        SavedRegistrySearchResponse response = registryService.saveSearch(
                contextService.resolveTenantId(tenantId), contextService.resolveUserId(userId), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Saved search created", response));
    }

    @DeleteMapping("/saved-searches/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSavedSearch(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        registryService.deleteSavedSearch(contextService.resolveTenantId(tenantId), contextService.resolveUserId(userId), id);
        return ResponseEntity.ok(ApiResponse.success("Saved search deleted", null));
    }

    @GetMapping("/participants/{participantId}")
    public ResponseEntity<ApiResponse<RegistryParticipantResponse>> getParticipant(
            @PathVariable UUID participantId,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success(registryService.getParticipant(
                contextService.resolveTenantId(tenantId), participantId)));
    }

    @GetMapping("/participants/{participantId}/logs")
    public ResponseEntity<ApiResponse<ParticipantLogsResponse>> getParticipantLogs(
            @PathVariable UUID participantId,
            @RequestParam String type,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success(registryService.getParticipantLogs(
                contextService.resolveTenantId(tenantId), participantId, type)));
    }

    @GetMapping("/participants/{participantId}/survey-submissions")
    public ResponseEntity<ApiResponse<List<SurveySubmissionResponse>>> getSurveySubmissions(
            @PathVariable UUID participantId,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success(registryService.getSurveySubmissions(
                contextService.resolveTenantId(tenantId), participantId)));
    }

    @PostMapping("/participants")
    public ResponseEntity<ApiResponse<RegistryParticipantResponse>> createParticipant(
            @Valid @RequestBody CreateRegistryParticipantRequest request,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        RegistryParticipantResponse response = registryService.createParticipant(
                contextService.resolveTenantId(tenantId), contextService.resolveUserId(userId), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Participant created", response));
    }

    @PutMapping("/participants/{participantId}")
    public ResponseEntity<ApiResponse<RegistryParticipantResponse>> updateParticipant(
            @PathVariable UUID participantId,
            @Valid @RequestBody UpdateRegistryParticipantRequest request,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success("Participant updated", registryService.updateParticipant(
                contextService.resolveTenantId(tenantId), participantId, request)));
    }

    @DeleteMapping("/participants/{participantId}")
    public ResponseEntity<ApiResponse<Void>> deleteParticipant(
            @PathVariable UUID participantId,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        registryService.deleteParticipant(contextService.resolveTenantId(tenantId), participantId);
        return ResponseEntity.ok(ApiResponse.success("Participant deleted", null));
    }

    @PostMapping("/participants/{participantId}/studies")
    public ResponseEntity<ApiResponse<RegistryParticipantResponse>> addParticipantToStudy(
            @PathVariable UUID participantId,
            @Valid @RequestBody AddParticipantToStudyRequest request,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success("Participant added to study", registryService.addParticipantToStudy(
                contextService.resolveTenantId(tenantId), participantId, request)));
    }

    @PostMapping("/export")
    public ResponseEntity<ApiResponse<RegistryExportResponse>> export(
            @Valid @RequestBody RegistryExportRequest request,
            @RequestHeader(value = "X-Tenant-Id", required = false) UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success("Registry export prepared", registryService.export(
                contextService.resolveTenantId(tenantId), request)));
    }
}
