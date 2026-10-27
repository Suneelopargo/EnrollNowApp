package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantContactLogService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/participants")
public class ParticipantContactLogController {

    private static final Logger log = LoggerFactory.getLogger(ParticipantContactLogController.class);

    private final ParticipantContactLogService contactLogService;
    private final SiteAuthorizationService siteAuthorizationService;

    public ParticipantContactLogController(
            ParticipantContactLogService contactLogService,
            SiteAuthorizationService siteAuthorizationService) {
        this.contactLogService = contactLogService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    private UUID resolveTenantId(UUID queryTenantId) {
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to access Registry resources"));
        if (caller.tenantId() != null) {
            if (queryTenantId != null && !caller.tenantId().equals(queryTenantId)) {
                throw new AccessDeniedException("Access denied: cross-tenant operation is not permitted");
            }
            return caller.tenantId();
        }
        if (queryTenantId != null) {
            return queryTenantId;
        }
        throw new AccessDeniedException("Authenticated caller is not associated with any tenant");
    }

    private UUID resolveUserId() {
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to access Registry resources"));
        if (caller.userId() != null) {
            return caller.userId();
        }
        throw new AccessDeniedException("Authenticated caller has no user ID");
    }

    @GetMapping("/{participantId}/contact-logs")
    public ResponseEntity<List<ParticipantContactLogDto>> getContactLogs(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestParam(required = false) UUID studyId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        List<ParticipantContactLogDto> logs = contactLogService.getContactLogs(resolvedTenantId, participantId, studyId, userId);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{participantId}/contact-logs/{logId}")
    public ResponseEntity<ParticipantContactLogDto> getContactLog(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantContactLogDto dto = contactLogService.getContactLog(resolvedTenantId, participantId, logId, userId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/contact-types")
    public ResponseEntity<List<ContactTypeOptionDto>> getContactTypes(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID studyId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);

        List<ContactTypeOptionDto> types = contactLogService.getContactTypes(resolvedTenantId, studyId);
        return ResponseEntity.ok(types);
    }

    @GetMapping("/contact-outcomes")
    public ResponseEntity<List<ContactOutcomeDto>> getContactOutcomes(
            @RequestParam(required = false) UUID tenantId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);

        List<ContactOutcomeDto> outcomes = contactLogService.getContactOutcomes(resolvedTenantId);
        return ResponseEntity.ok(outcomes);
    }

    @GetMapping("/{participantId}/contact-methods")
    public ResponseEntity<List<ContactMethodOptionDto>> getParticipantContactMethods(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID studyId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);

        List<ContactMethodOptionDto> methods = contactLogService.getParticipantContactMethods(resolvedTenantId, participantId, studyId);
        return ResponseEntity.ok(methods);
    }

    @GetMapping("/contact-team-members")
    public ResponseEntity<List<ContactTeamMemberDto>> getContactTeamMembers(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID studyId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, null);

        List<ContactTeamMemberDto> members = contactLogService.getContactTeamMembers(resolvedTenantId, studyId);
        return ResponseEntity.ok(members);
    }

    @PostMapping("/{participantId}/contact-logs")
    public ResponseEntity<ParticipantContactLogDto> createContactLog(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestBody CreateContactLogRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantContactLogDto created = contactLogService.createContactLog(resolvedTenantId, participantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{participantId}/contact-logs/{logId}")
    public ResponseEntity<ParticipantContactLogDto> updateContactLog(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @Valid @RequestBody UpdateContactLogRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantContactLogDto updated = contactLogService.updateContactLog(resolvedTenantId, participantId, logId, userId, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{participantId}/contact-logs/{logId}/pin")
    public ResponseEntity<ParticipantContactLogDto> pinContactLog(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId,
            @RequestBody PinContactLogRequest request) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantContactLogDto pinned = contactLogService.pinContactLog(resolvedTenantId, participantId, logId, userId, request.isSticky());
        return ResponseEntity.ok(pinned);
    }

    @DeleteMapping("/{participantId}/contact-logs/{logId}")
    public ResponseEntity<Void> deleteContactLog(
            @PathVariable UUID participantId,
            @PathVariable UUID logId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId) {

        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        contactLogService.deleteContactLog(resolvedTenantId, participantId, logId, userId);
        return ResponseEntity.noContent().build();
    }
}
