package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class StudyController {

    private final StudyRepository studyRepository;
    private final SiteAuthorizationService siteAuthorizationService;
    private final com.enrollnow.study.services.MyStudiesService myStudiesService;

    public StudyController(StudyRepository studyRepository) {
        this(studyRepository, null, null);
    }

    public StudyController(
            StudyRepository studyRepository,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this(studyRepository, siteAuthorizationService, null);
    }

    @Autowired
    public StudyController(
            StudyRepository studyRepository,
            SiteAuthorizationService siteAuthorizationService,
            com.enrollnow.study.services.MyStudiesService myStudiesService
    ) {
        this.studyRepository = studyRepository;
        this.siteAuthorizationService = siteAuthorizationService;
        this.myStudiesService = myStudiesService;
    }

    @GetMapping({"/tenants/{tenantId}/studies", "/studies"})
    public ResponseEntity<ApiResponse<List<StudySummaryResponse>>> getStudies(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);

        List<Study> studies;
        if (effectiveTenantId != null) {
            studies = includeArchived
                    ? studyRepository.findByTenantId(effectiveTenantId)
                    : studyRepository.findByTenantIdAndArchivedFalse(effectiveTenantId);
        } else {
            studies = includeArchived
                    ? studyRepository.findAll()
                    : studyRepository.findAll().stream().filter(s -> !s.isArchived()).collect(Collectors.toList());
        }

        // If this is the direct /api/v1/studies endpoint (tenantId not specified in path)
        // and the user is limited to assigned studies (such as SITE_MANAGER, SITE_REGISTRY, or non-admin),
        // filter the studies list to the user's assigned studies.
        if (tenantId == null && siteAuthorizationService != null && myStudiesService != null) {
            Optional<com.enrollnow.identity.dtos.UserEffectivePermissionsResponse> effectiveOpt =
                    siteAuthorizationService.getCallerEffectivePermissions(effectiveTenantId, null);
            if (effectiveOpt.isPresent()) {
                com.enrollnow.identity.dtos.UserEffectivePermissionsResponse effective = effectiveOpt.get();
                if (!effective.isCanManageSiteAdmins()) {
                    List<com.enrollnow.study.dtos.MyStudyResponse> myStudies =
                            myStudiesService.getMyStudies(effectiveTenantId, effective.getUserId());
                    java.util.Set<UUID> assignedIds = myStudies.stream()
                            .map(com.enrollnow.study.dtos.MyStudyResponse::getId)
                            .collect(Collectors.toSet());
                    studies = studies.stream()
                            .filter(s -> assignedIds.contains(s.getId()))
                            .collect(Collectors.toList());
                }
            }
        }

        List<StudySummaryResponse> response = studies.stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}", "/studies/{studyId}"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> getStudyById(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        Optional<Study> studyOpt = findStudyByIdOrCode(effectiveTenantId, studyId);
        if (studyOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("STUDY_NOT_FOUND", "Study not found: " + studyId));
        }
        return ResponseEntity.ok(ApiResponse.success(toSummaryResponse(studyOpt.get())));
    }

    @PostMapping({"/tenants/{tenantId}/studies", "/studies"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> createStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (effectiveTenantId == null) {
            effectiveTenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        }

        Map<String, Object> body = payload != null ? payload : Map.of();
        String name = body.get("name") != null ? String.valueOf(body.get("name"))
                : body.get("title") != null ? String.valueOf(body.get("title")) : "New Study";
        String code = body.get("studyCode") != null ? String.valueOf(body.get("studyCode"))
                : body.get("protocolNumber") != null ? String.valueOf(body.get("protocolNumber"))
                : "STD-" + System.currentTimeMillis();
        String description = body.get("description") != null ? String.valueOf(body.get("description")) : "";

        Study study = new Study();
        study.setTenantId(effectiveTenantId);
        study.setName(name);
        study.setStudyCode(code);
        study.setDescription(description);
        study.setArchived(false);
        study.setCreatedAt(OffsetDateTime.now());
        study.setUpdatedAt(OffsetDateTime.now());

        Study saved = studyRepository.save(study);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study created successfully", toSummaryResponse(saved)));
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}", "/studies/{studyId}"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> updateStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        Optional<Study> studyOpt = findStudyByIdOrCode(effectiveTenantId, studyId);
        if (studyOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("STUDY_NOT_FOUND", "Study not found: " + studyId));
        }

        Study study = studyOpt.get();
        if (payload != null) {
            if (payload.containsKey("name")) {
                study.setName(String.valueOf(payload.get("name")));
            } else if (payload.containsKey("title")) {
                study.setName(String.valueOf(payload.get("title")));
            }
            if (payload.containsKey("description")) {
                study.setDescription(String.valueOf(payload.get("description")));
            }
            if (payload.containsKey("archived")) {
                study.setArchived(Boolean.parseBoolean(String.valueOf(payload.get("archived"))));
            }
        }
        study.setUpdatedAt(OffsetDateTime.now());

        Study updated = studyRepository.save(study);
        return ResponseEntity.ok(ApiResponse.success("Study updated successfully", toSummaryResponse(updated)));
    }

    private StudySummaryResponse toSummaryResponse(Study s) {
        StudySummaryResponse res = new StudySummaryResponse(
                s.getId(),
                s.getStudyCode(),
                s.getName(),
                s.getDescription(),
                s.isArchived()
        );
        int sample = s.getSampleSize() != null ? s.getSampleSize() : 100;
        res.setSampleSize(sample);
        int enrolled = Math.max(0, (int) Math.round(sample * 0.65));
        res.setEnrolled(enrolled);
        return res;
    }

    private Optional<Study> findStudyByIdOrCode(UUID tenantId, String studyId) {
        if (studyId == null || studyId.isBlank()) {
            return Optional.empty();
        }

        UUID idUuid = null;
        try {
            idUuid = UUID.fromString(studyId.trim());
        } catch (IllegalArgumentException ignored) {
        }

        if (idUuid != null) {
            if (tenantId != null) {
                Optional<Study> byId = studyRepository.findByTenantIdAndId(tenantId, idUuid);
                if (byId.isPresent()) {
                    return byId;
                }
            }
            Optional<Study> byId = studyRepository.findById(idUuid);
            if (byId.isPresent()) {
                return byId;
            }
        }

        if (tenantId != null) {
            return studyRepository.findByTenantIdAndStudyCode(tenantId, studyId.trim());
        }
        return Optional.empty();
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
