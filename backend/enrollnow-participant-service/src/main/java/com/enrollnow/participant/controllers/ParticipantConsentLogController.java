package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantConsentLogService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/participants")
public class ParticipantConsentLogController {

    private static final Logger log = LoggerFactory.getLogger(ParticipantConsentLogController.class);

    private final ParticipantConsentLogService consentLogService;
    private final SiteAuthorizationService siteAuthorizationService;

    public ParticipantConsentLogController(
            ParticipantConsentLogService consentLogService,
            SiteAuthorizationService siteAuthorizationService) {
        this.consentLogService = consentLogService;
        this.siteAuthorizationService = siteAuthorizationService;
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

    @GetMapping("/{participantId}/consent-logs")
    public ResponseEntity<List<ParticipantConsentLogDto>> getConsentLogs(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestParam(required = false) UUID studyId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        List<ParticipantConsentLogDto> logs = consentLogService.getConsentLogs(resolvedTenantId, participantId, studyId, userId);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{participantId}/consent-logs/{logId}")
    public ResponseEntity<ParticipantConsentLogDto> getConsentLog(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantConsentLogDto dto = consentLogService.getConsentLog(resolvedTenantId, participantId, logId, userId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/consent-types")
    public ResponseEntity<List<ConsentTypeOptionDto>> getConsentTypes(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID studyId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);

        List<ConsentTypeOptionDto> types = consentLogService.getConsentTypes(resolvedTenantId, studyId);
        return ResponseEntity.ok(types);
    }

    @PostMapping(value = "/{participantId}/consent-logs", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ParticipantConsentLogDto> createConsentLogJson(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestBody CreateConsentLogRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantConsentLogDto created = consentLogService.createConsentLog(resolvedTenantId, participantId, userId, request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/{participantId}/consent-logs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ParticipantConsentLogDto> createConsentLogMultipart(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestPart("data") CreateConsentLogRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantConsentLogDto created = consentLogService.createConsentLog(resolvedTenantId, participantId, userId, request, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping(value = "/{participantId}/consent-logs/{logId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ParticipantConsentLogDto> updateConsentLogJson(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestBody UpdateConsentLogRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantConsentLogDto updated = consentLogService.updateConsentLog(resolvedTenantId, participantId, logId, userId, request, null);
        return ResponseEntity.ok(updated);
    }

    @PutMapping(value = "/{participantId}/consent-logs/{logId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ParticipantConsentLogDto> updateConsentLogMultipart(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestPart("data") UpdateConsentLogRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantConsentLogDto updated = consentLogService.updateConsentLog(resolvedTenantId, participantId, logId, userId, request, file);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{participantId}/consent-logs/{logId}/pin")
    public ResponseEntity<ParticipantConsentLogDto> pinConsentLog(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestBody PinContactLogRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantConsentLogDto pinned = consentLogService.pinConsentLog(resolvedTenantId, participantId, logId, userId, request.isSticky());
        return ResponseEntity.ok(pinned);
    }

    @DeleteMapping("/{participantId}/consent-logs/{logId}")
    public ResponseEntity<Void> deleteConsentLog(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        consentLogService.deleteConsentLog(resolvedTenantId, participantId, logId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{participantId}/consent-logs/{logId}/attachment")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantConsentLogService.ConsentAttachmentDownload download =
                consentLogService.getConsentAttachment(resolvedTenantId, participantId, logId, userId);

        String encodedFilename = URLEncoder.encode(download.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
        String contentDisposition = "attachment; filename=\"" + download.fileName() + "\"; filename*=UTF-8''" + encodedFilename;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .contentLength(download.contentLength())
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .body(download.resource());
    }
}
