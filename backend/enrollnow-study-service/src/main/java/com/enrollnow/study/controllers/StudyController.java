package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.CopyStudyRequest;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.ImportStudyRequest;
import com.enrollnow.study.dtos.ImportStudyResponse;
import com.enrollnow.study.dtos.StudyNavigationPermissionsResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyRequest;
import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.services.MyStudiesService;
import com.enrollnow.study.services.StudyService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class StudyController {

    private final StudyService studyService;
    private final SiteAuthorizationService siteAuthorizationService;
    private final ObjectMapper objectMapper;

    public StudyController(StudyRepository studyRepository) {
        this(new StudyService(studyRepository), null, null);
    }

    public StudyController(
            StudyRepository studyRepository,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this(new StudyService(studyRepository), siteAuthorizationService, null);
    }

    public StudyController(
            StudyRepository studyRepository,
            SiteAuthorizationService siteAuthorizationService,
            MyStudiesService myStudiesService
    ) {
        this(new StudyService(studyRepository, myStudiesService), siteAuthorizationService, null);
    }

    public StudyController(
            StudyService studyService,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this(studyService, siteAuthorizationService, null);
    }

    @Autowired
    public StudyController(
            StudyService studyService,
            SiteAuthorizationService siteAuthorizationService,
            ObjectMapper objectMapper
    ) {
        this.studyService = studyService;
        this.siteAuthorizationService = siteAuthorizationService;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public ResponseEntity<ApiResponse<List<StudySummaryResponse>>> getStudies(
            UUID tenantId,
            boolean includeArchived
    ) {
        return getStudies(tenantId, includeArchived, null);
    }

    @GetMapping({"/tenants/{tenantId}/studies", "/studies"})
    public ResponseEntity<ApiResponse<List<StudySummaryResponse>>> getStudies(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived,
            @RequestParam(required = false) String status
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
                status,
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
        UUID callerUserId = null;
        boolean canManageSiteAdmins = true;

        if (siteAuthorizationService != null) {
            Optional<com.enrollnow.identity.dtos.UserEffectivePermissionsResponse> effectiveOpt =
                    siteAuthorizationService.getCallerEffectivePermissions(effectiveTenantId, null);
            if (effectiveOpt.isPresent()) {
                callerUserId = effectiveOpt.get().getUserId();
                canManageSiteAdmins = effectiveOpt.get().isCanManageSiteAdmins()
                        || effectiveOpt.get().isCanAccessSiteAdmin()
                        || effectiveOpt.get().getPermissions().contains(com.enrollnow.identity.services.SitePermissionService.PERM_SITE_ALL_STUDIES_MANAGE);
            }
        }

        try {
            StudySummaryResponse summary = studyService.getStudyByIdOrCode(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(summary));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/permissions", "/studies/{studyId}/permissions"})
    public ResponseEntity<ApiResponse<StudyNavigationPermissionsResponse>> getStudyNavigationPermissions(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = null;
        boolean canManageSiteAdmins = false;

        if (siteAuthorizationService != null) {
            Optional<SiteAuthorizationService.CallerIdentity> callerOpt = siteAuthorizationService.getAuthenticatedCaller();
            if (callerOpt.isPresent()) {
                callerUserId = callerOpt.get().userId();
            }
            Optional<com.enrollnow.identity.dtos.UserEffectivePermissionsResponse> effectiveOpt =
                    siteAuthorizationService.getCallerEffectivePermissions(effectiveTenantId, null);
            if (effectiveOpt.isPresent()) {
                if (callerUserId == null) {
                    callerUserId = effectiveOpt.get().getUserId();
                }
                canManageSiteAdmins = effectiveOpt.get().isCanManageSiteAdmins()
                        || effectiveOpt.get().getPermissions().contains(com.enrollnow.identity.services.SitePermissionService.PERM_SITE_ALL_STUDIES_MANAGE);
            }
        }

        try {
            StudyNavigationPermissionsResponse permissions = studyService.getStudyNavigationPermissions(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(permissions));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (org.springframework.security.core.AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "UNAUTHORIZED", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies", "/studies"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> createStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @Valid @RequestBody CreateStudyRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        UUID callerUserId = resolveCallerUserId();
        StudySummaryResponse saved = studyService.createStudy(effectiveTenantId, request, callerUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study created successfully", saved));
    }

    @PostMapping({"/tenants/{tenantId}/studies/copy", "/studies/copy"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> copyStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @Valid @RequestBody CopyStudyRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        UUID callerUserId = resolveCallerUserId();
        StudySummaryResponse cloned = studyService.copyStudy(effectiveTenantId, request, callerUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study copied successfully", cloned));
    }

    @PostMapping(
            value = {"/tenants/{tenantId}/studies/import", "/studies/import"},
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ApiResponse<ImportStudyResponse>> importStudyJson(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @Valid @RequestBody ImportStudyRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        UUID callerUserId = resolveCallerUserId();

        if (request == null || request.getStudyName() == null || request.getStudyName().isBlank()) {
            throw new InvalidStudyException("Must provide a study name to import a new study.");
        }

        Map<String, Object> studyData = request.getStudyData() != null ? request.getStudyData() : Collections.emptyMap();
        ImportStudyResponse response = studyService.importStudy(effectiveTenantId, request.getStudyName().trim(), studyData, callerUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study imported successfully", response));
    }

    @PostMapping(
            value = {"/tenants/{tenantId}/studies/import", "/studies/import"},
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<ImportStudyResponse>> importStudyMultipart(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "studyName", required = false) String studyNameParam,
            @RequestParam(value = "shortName", required = false) String shortNameParam
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        UUID callerUserId = resolveCallerUserId();

        if (file == null || file.isEmpty()) {
            throw new InvalidStudyException("Must select a file to import a study.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && !originalFilename.toLowerCase().endsWith(".json")) {
            throw new InvalidStudyException("Must select a .json file to import a study.");
        }

        Map<String, Object> dataJSON;
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            dataJSON = objectMapper.readValue(content, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            throw new InvalidStudyException("File contents lack the proper JSON format, please try again.");
        }

        String studyName = studyNameParam != null && !studyNameParam.isBlank()
                ? studyNameParam.trim()
                : (shortNameParam != null && !shortNameParam.isBlank() ? shortNameParam.trim() : null);

        if (studyName == null && dataJSON.get("study") instanceof Map<?, ?> stMap && stMap.get("name") != null) {
            studyName = String.valueOf(stMap.get("name")).trim();
        } else if (studyName == null && dataJSON.get("studyName") != null) {
            studyName = String.valueOf(dataJSON.get("studyName")).trim();
        }

        if (studyName == null || studyName.isBlank()) {
            throw new InvalidStudyException("Must provide a study name to import a new study.");
        }

        ImportStudyResponse response = studyService.importStudy(effectiveTenantId, studyName, dataJSON, callerUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study imported successfully", response));
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}", "/studies/{studyId}"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> updateStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody UpdateStudyRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);
        }

        try {
            StudySummaryResponse updated = studyService.updateStudy(effectiveTenantId, studyId, request);
            return ResponseEntity.ok(ApiResponse.success("Study updated successfully", updated));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/archive", "/studies/{studyId}/archive"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> archiveStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);
        }

        try {
            StudySummaryResponse archived = studyService.archiveStudy(effectiveTenantId, studyId);
            return ResponseEntity.ok(ApiResponse.success("Study archived successfully", archived));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/restore", "/studies/{studyId}/restore"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> restoreStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);
        }

        try {
            StudySummaryResponse restored = studyService.restoreStudy(effectiveTenantId, studyId);
            return ResponseEntity.ok(ApiResponse.success("Study restored successfully", restored));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @DeleteMapping({"/tenants/{tenantId}/studies/{studyId}", "/studies/{studyId}"})
    public ResponseEntity<ApiResponse<Void>> deleteStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);
        }

        try {
            studyService.deleteStudy(effectiveTenantId, studyId);
            return ResponseEntity.ok(ApiResponse.success("Study deleted successfully", null));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    private UUID resolveCallerUserId() {
        if (siteAuthorizationService != null) {
            Optional<SiteAuthorizationService.CallerIdentity> callerOpt = siteAuthorizationService.getAuthenticatedCaller();
            if (callerOpt.isPresent()) {
                return callerOpt.get().userId();
            }
        }
        return null;
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
        return targetTenantId != null ? targetTenantId : UUID.fromString("11111111-1111-1111-1111-111111111111");
    }
}
