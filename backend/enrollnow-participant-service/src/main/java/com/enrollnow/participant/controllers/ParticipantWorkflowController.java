package com.enrollnow.participant.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.services.ParticipantWorkflowService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/participants")
public class ParticipantWorkflowController {

    private final ParticipantWorkflowService workflowService;
    private final SiteAuthorizationService siteAuthorizationService;

    public ParticipantWorkflowController(
            ParticipantWorkflowService workflowService,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this.workflowService = workflowService;
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

    private String resolveUserName() {
        return "Current User";
    }

    // =========================================================================
    // 1. COMMENTS
    // =========================================================================

    @GetMapping("/{participantId}/comments")
    public ResponseEntity<List<ParticipantCommentDto>> getComments(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getComments(resolvedTenantId, participantId));
    }

    @PostMapping("/{participantId}/comments")
    public ResponseEntity<ParticipantCommentDto> createComment(
            @PathVariable UUID participantId,
            @Valid @RequestBody CreateCommentRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantCommentDto created = workflowService.createComment(resolvedTenantId, participantId, userId, resolveUserName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{participantId}/comments/{commentId}")
    public ResponseEntity<ParticipantCommentDto> updateComment(
            @PathVariable UUID participantId,
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(workflowService.updateComment(resolvedTenantId, participantId, commentId, userId, request));
    }

    @PatchMapping("/{participantId}/comments/{commentId}/pin")
    public ResponseEntity<ParticipantCommentDto> pinComment(
            @PathVariable UUID participantId,
            @PathVariable UUID commentId,
            @RequestBody PinContactLogRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(workflowService.pinComment(resolvedTenantId, participantId, commentId, userId, request.isSticky()));
    }

    @DeleteMapping("/{participantId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID participantId,
            @PathVariable UUID commentId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        workflowService.deleteComment(resolvedTenantId, participantId, commentId, userId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 2. COMMUNICATIONS (EMAIL & SMS)
    // =========================================================================

    @GetMapping("/{participantId}/emails")
    public ResponseEntity<List<CommunicationDto>> getEmails(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getEmails(resolvedTenantId, participantId));
    }

    @PostMapping("/{participantId}/emails")
    public ResponseEntity<CommunicationDto> sendEmail(
            @PathVariable UUID participantId,
            @Valid @RequestBody SendEmailRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        CommunicationDto sent = workflowService.sendEmail(resolvedTenantId, participantId, userId, resolveUserName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    @PatchMapping("/{participantId}/emails/{emailId}/pin")
    public ResponseEntity<CommunicationDto> pinEmail(
            @PathVariable UUID participantId,
            @PathVariable UUID emailId,
            @RequestBody PinContactLogRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(workflowService.pinCommunication(resolvedTenantId, participantId, emailId, userId, request.isSticky()));
    }

    @GetMapping("/{participantId}/email-recipients")
    public ResponseEntity<List<String>> getEmailRecipients(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getEmailRecipients(resolvedTenantId, participantId));
    }

    @GetMapping("/{participantId}/sms")
    public ResponseEntity<List<CommunicationDto>> getSms(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getSms(resolvedTenantId, participantId));
    }

    @PostMapping("/{participantId}/sms")
    public ResponseEntity<CommunicationDto> sendSms(
            @PathVariable UUID participantId,
            @Valid @RequestBody SendSmsRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        CommunicationDto sent = workflowService.sendSms(resolvedTenantId, participantId, userId, resolveUserName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    @GetMapping("/{participantId}/sms-recipients")
    public ResponseEntity<List<String>> getSmsRecipients(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getSmsRecipients(resolvedTenantId, participantId));
    }

    // =========================================================================
    // 3. CONTACT MANAGEMENT (CONTACT PERSONS & ADDRESSES)
    // =========================================================================

    @GetMapping("/{participantId}/contacts")
    public ResponseEntity<List<ParticipantContactDto>> getContacts(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getContacts(resolvedTenantId, participantId));
    }

    @PostMapping("/{participantId}/contacts")
    public ResponseEntity<ParticipantContactDto> createContact(
            @PathVariable UUID participantId,
            @Valid @RequestBody CreateContactPersonRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantContactDto created = workflowService.createContact(resolvedTenantId, participantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{participantId}/contacts/{contactId}")
    public ResponseEntity<Void> deleteContact(
            @PathVariable UUID participantId,
            @PathVariable UUID contactId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        workflowService.deleteContact(resolvedTenantId, participantId, contactId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{participantId}/addresses")
    public ResponseEntity<List<ParticipantAddressDto>> getAddresses(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getAddresses(resolvedTenantId, participantId));
    }

    @PostMapping("/{participantId}/addresses")
    public ResponseEntity<ParticipantAddressDto> createAddress(
            @PathVariable UUID participantId,
            @Valid @RequestBody CreateAddressRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ParticipantAddressDto created = workflowService.createAddress(resolvedTenantId, participantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{participantId}/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable UUID participantId,
            @PathVariable UUID addressId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        workflowService.deleteAddress(resolvedTenantId, participantId, addressId, userId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 4. CONSENTS
    // =========================================================================

    @GetMapping("/{participantId}/consents")
    public ResponseEntity<List<ConsentDto>> getConsents(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getConsents(resolvedTenantId, participantId));
    }

    @PostMapping("/{participantId}/consents")
    public ResponseEntity<ConsentDto> recordConsent(
            @PathVariable UUID participantId,
            @Valid @RequestBody RecordConsentRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        ConsentDto recorded = workflowService.recordConsent(resolvedTenantId, participantId, userId, resolveUserName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(recorded);
    }

    @GetMapping("/{participantId}/consent-options")
    public ResponseEntity<List<ConsentOptionDto>> getConsentOptions(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getConsentOptions(resolvedTenantId, participantId));
    }

    // =========================================================================
    // 5. FORMS & SURVEY ASSIGNMENTS
    // =========================================================================

    @GetMapping("/{participantId}/forms")
    public ResponseEntity<List<SurveyAssignmentDto>> getForms(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getSurveyAssignments(resolvedTenantId, participantId));
    }

    @PostMapping("/{participantId}/forms/assign")
    public ResponseEntity<SurveyAssignmentDto> assignForm(
            @PathVariable UUID participantId,
            @Valid @RequestBody AssignSurveyRequest request,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        UUID userId = resolveUserId();
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        SurveyAssignmentDto assigned = workflowService.assignSurvey(resolvedTenantId, participantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(assigned);
    }

    @PatchMapping("/{participantId}/forms/{assignmentId}/status")
    public ResponseEntity<SurveyAssignmentDto> updateFormStatus(
            @PathVariable UUID participantId,
            @PathVariable UUID assignmentId,
            @RequestParam String status,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);

        return ResponseEntity.ok(workflowService.updateSurveyStatus(resolvedTenantId, participantId, assignmentId, status));
    }

    @GetMapping("/{participantId}/available-forms")
    public ResponseEntity<List<SurveyOptionDto>> getAvailableForms(
            @PathVariable UUID participantId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID siteId
    ) {
        UUID resolvedTenantId = resolveTenantId(tenantId);
        siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId);
        return ResponseEntity.ok(workflowService.getAvailableSurveys(resolvedTenantId, participantId));
    }
}
