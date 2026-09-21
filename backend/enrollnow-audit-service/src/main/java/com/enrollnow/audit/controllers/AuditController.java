package com.enrollnow.audit.controllers;

import com.enrollnow.audit.models.AdminAuditLog;
import com.enrollnow.audit.repositories.AdminAuditLogRepository;
import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit Ledger", description = "Endpoints for recording and auditing security, authentication, and governance operations")
@SecurityRequirement(name = "BearerAuth")
public class AuditController {

    private final AdminAuditLogRepository auditRepository;

    public AuditController(AdminAuditLogRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    @GetMapping("/logs")
    @Operation(summary = "Query Audit Trail Events")
    public ResponseEntity<ApiResponse<Page<AdminAuditLog>>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) Long targetUserId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Specification<AdminAuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (performedBy != null && !performedBy.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("performedByUsername")), performedBy.toLowerCase()));
            }
            if (targetUserId != null) {
                predicates.add(cb.equal(root.get("targetUserId"), targetUserId));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate matchAction = cb.like(cb.lower(root.get("action")), pattern);
                Predicate matchDetails = cb.like(cb.lower(root.get("details")), pattern);
                predicates.add(cb.or(matchAction, matchDetails));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AdminAuditLog> result = auditRepository.findAll(
                spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/events")
    @Operation(summary = "Record Audit Event")
    public ResponseEntity<ApiResponse<AdminAuditLog>> recordEvent(@RequestBody AdminAuditLog event) {
        AdminAuditLog saved = auditRepository.save(event);
        return ResponseEntity.ok(ApiResponse.success("Audit event recorded", saved));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Audit Ledger Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-audit-service",
                "status", "OPERATIONAL",
                "capabilities", "Audit Ledger Foundation, Event Queries"
        )));
    }
}
