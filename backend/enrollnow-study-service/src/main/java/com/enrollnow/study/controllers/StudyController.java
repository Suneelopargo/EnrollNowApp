package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyRequest;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.services.MyStudiesService;
import com.enrollnow.study.services.StudyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class StudyController {

    private final StudyService studyService;
    private final SiteAuthorizationService siteAuthorizationService;

    public StudyController(StudyRepository studyRepository) {
        this(new StudyService(studyRepository), null);
    }

    public StudyController(
            StudyRepository studyRepository,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this(new StudyService(studyRepository), siteAuthorizationService);
    }

    public StudyController(
            StudyRepository studyRepository,
            SiteAuthorizationService siteAuthorizationService,
            MyStudiesService myStudiesService
    ) {
        this(new StudyService(studyRepository, myStudiesService), siteAuthorizationService);
    }

    @Autowired
    public StudyController(
            StudyService studyService,
            @Autowired(required = false) SiteAuthorizationService siteAuthorizationService
    ) {
        this.studyService = studyService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @GetMapping({"/tenants/{tenantId}/studies", "/studies"})
    public ResponseEntity<ApiResponse<List<StudySummaryResponse>>> getStudies(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);

        UUID callerUserId = null;
        boolean canManageSiteAdmins = true;

        if (siteAuthorizationService != null) {
            Optional<com.enrollnow.identity.dtos.UserEffectivePermissionsResponse> effectiveOpt =
                    siteAuthorizationService.getCallerEffectivePermissions(effectiveTenantId, null);
            if (effectiveOpt.isPresent()) {
                callerUserId = effectiveOpt.get().getUserId();
                canManageSiteAdmins = effectiveOpt.get().isCanManageSiteAdmins();
            }
        }

        List<StudySummaryResponse> response = studyService.getStudies(
                effectiveTenantId,
                includeArchived,
                callerUserId,
                canManageSiteAdmins
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}", "/studies/{studyId}"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> getStudyById(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        try {
            StudySummaryResponse summary = studyService.getStudyByIdOrCode(effectiveTenantId, studyId);
            return ResponseEntity.ok(ApiResponse.success(summary));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies", "/studies"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> createStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        CreateStudyRequest request = mapToCreateRequest(payload);

        StudySummaryResponse saved = studyService.createStudy(effectiveTenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study created successfully", saved));
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}", "/studies/{studyId}"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> updateStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UpdateStudyRequest request = mapToUpdateRequest(payload);

        try {
            StudySummaryResponse updated = studyService.updateStudy(effectiveTenantId, studyId, request);
            return ResponseEntity.ok(ApiResponse.success("Study updated successfully", updated));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    private CreateStudyRequest mapToCreateRequest(Map<String, Object> body) {
        if (body == null) {
            return new CreateStudyRequest();
        }
        String name = body.get("name") != null ? String.valueOf(body.get("name"))
                : body.get("title") != null ? String.valueOf(body.get("title")) : "New Study";
        String code = body.get("studyCode") != null ? String.valueOf(body.get("studyCode"))
                : body.get("protocolNumber") != null ? String.valueOf(body.get("protocolNumber"))
                : "STD-" + System.currentTimeMillis();
        String description = body.get("description") != null ? String.valueOf(body.get("description")) : "";
        Integer sampleSize = null;
        if (body.get("sampleSize") instanceof Number n) {
            sampleSize = n.intValue();
        } else if (body.get("targetEnrollment") instanceof Number n) {
            sampleSize = n.intValue();
        }

        return new CreateStudyRequest(name, code, description, sampleSize);
    }

    private UpdateStudyRequest mapToUpdateRequest(Map<String, Object> body) {
        if (body == null) {
            return new UpdateStudyRequest();
        }
        String name = body.containsKey("name") ? String.valueOf(body.get("name"))
                : body.containsKey("title") ? String.valueOf(body.get("title")) : null;
        String description = body.containsKey("description") ? String.valueOf(body.get("description")) : null;
        Boolean archived = body.containsKey("archived") ? Boolean.parseBoolean(String.valueOf(body.get("archived"))) : null;
        Integer sampleSize = null;
        if (body.get("sampleSize") instanceof Number n) {
            sampleSize = n.intValue();
        } else if (body.get("targetEnrollment") instanceof Number n) {
            sampleSize = n.intValue();
        }
        return new UpdateStudyRequest(name, description, archived, sampleSize);
    }

    private UUID resolveTenantId(UUID targetTenantId) {
        if (siteAuthorizationService != null) {
            if (targetTenantId != null) {
                siteAuthorizationService.requireTenantMatch(targetTenantId);
                return targetTenantId;
            }
            Optional<SiteAuthorizationService.CallerIdentity> callerOpt = siteAuthorizationService.getAuthenticatedCaller();
            if (callerOpt.isPresent()) {
                return callerOpt.get().tenantId();
            }
        }
        return targetTenantId;
    }
}
