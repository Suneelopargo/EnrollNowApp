package com.enrollnow.audit.controllers;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.enrollnow.audit.dtos.AuditEventResponse;
import com.enrollnow.audit.dtos.EntityChangeHistoryResponse;
import com.enrollnow.audit.services.AuditQueryService;
import com.enrollnow.identity.services.SiteAuthorizationService;

@RestController
@RequestMapping("/api/v1/administrator/audit-logs")
public class AuditLogController {

    private static final int MAX_PAGE_SIZE = 500;

    private final AuditQueryService auditQueryService;
    private final SiteAuthorizationService siteAuthorizationService;

    public AuditLogController(
            AuditQueryService auditQueryService,
            SiteAuthorizationService siteAuthorizationService) {
        this.auditQueryService = auditQueryService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @GetMapping
    public ResponseEntity<Page<AuditEventResponse>> getAuditEvents(
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fromDate must be on or before toDate");
        }

        UUID tenantId = siteAuthorizationService.requireAuditLogView(null);
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "occurredAt"));

        return ResponseEntity.ok(auditQueryService.getEvents(
                tenantId, fromDate, toDate, action, search, pageable));
    }

    @GetMapping("/{auditEventId}/changes")
    public ResponseEntity<List<EntityChangeHistoryResponse>> getEntityChangeHistory(
            @PathVariable UUID auditEventId) {
        UUID tenantId = siteAuthorizationService.requireAuditLogView(null);
        return ResponseEntity.ok(auditQueryService.getChanges(tenantId, auditEventId));
    }
}
