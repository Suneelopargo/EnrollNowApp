package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.CopyStudyRequest;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.ImportStudyRequest;
import com.enrollnow.study.dtos.ImportStudyResponse;
import com.enrollnow.study.dtos.ReorderBulkTasksRequest;
import com.enrollnow.study.dtos.SaveBulkTaskGroupRequest;
import com.enrollnow.study.dtos.SaveBulkTaskRequest;
import com.enrollnow.study.dtos.StudyBulkTasksResponse;
import com.enrollnow.study.dtos.StudyCustomVariableDto;
import com.enrollnow.study.dtos.StudyDetailsResponse;
import com.enrollnow.study.dtos.StudyMilestoneDto;
import com.enrollnow.study.dtos.ReorderTemplatesRequest;
import com.enrollnow.study.dtos.SaveEmailTemplateRequest;
import com.enrollnow.study.dtos.SaveTextTemplateRequest;
import com.enrollnow.study.dtos.StudyDisplaySettingsResponse;
import com.enrollnow.study.dtos.StudyEmailTextSettingsResponse;
import com.enrollnow.study.dtos.StudyNavigationPermissionsResponse;
import com.enrollnow.study.dtos.StudyRequirementsResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyDetailsRequest;
import com.enrollnow.study.dtos.UpdateStudyDisplaySettingsRequest;
import com.enrollnow.study.dtos.UpdateStudyRequirementsRequest;
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

    @Autowired
    public StudyController(
            StudyService studyService,
            SiteAuthorizationService siteAuthorizationService,
            ObjectMapper objectMapper
    ) {
        this.studyService = Objects.requireNonNull(studyService, "studyService must not be null");
        this.siteAuthorizationService = Objects.requireNonNull(siteAuthorizationService, "siteAuthorizationService must not be null");
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public StudyController(
            StudyService studyService,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this(studyService, siteAuthorizationService, new ObjectMapper());
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
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

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
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

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
        try {
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
        siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);

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
        siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);

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
        siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);

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
        siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);

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
        siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);

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
        siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);

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
        siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);

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
        siteAuthorizationService.requireStudyManageAccess(effectiveTenantId);

        try {
            studyService.deleteStudy(effectiveTenantId, studyId);
            return ResponseEntity.ok(ApiResponse.success("Study deleted successfully", null));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/details", "/studies/{studyId}/details"})
    public ResponseEntity<ApiResponse<StudyDetailsResponse>> getStudyDetails(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyDetailsResponse details = studyService.getStudyDetails(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(details));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/details", "/studies/{studyId}/details"})
    public ResponseEntity<ApiResponse<StudyDetailsResponse>> updateStudyDetails(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody UpdateStudyDetailsRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyDetailsResponse updated = studyService.updateStudyDetails(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Study details updated successfully", updated));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/export", "/studies/{studyId}/export"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            Map<String, Object> export = studyService.exportStudy(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(export));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/import-components", "/studies/{studyId}/import-components"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> importStudyComponents(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody com.enrollnow.study.dtos.ImportStudyComponentsRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            Map<String, Object> components = request != null ? request.getComponents() : Collections.emptyMap();
            Map<String, Object> result = studyService.importStudyComponents(
                    effectiveTenantId,
                    studyId,
                    components,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Study components imported successfully", result));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/display-settings", "/studies/{studyId}/display-settings"})
    public ResponseEntity<ApiResponse<StudyDisplaySettingsResponse>> getStudyDisplaySettings(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyDisplaySettingsResponse response = studyService.getStudyDisplaySettings(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/display-settings", "/studies/{studyId}/display-settings"})
    public ResponseEntity<ApiResponse<StudyDisplaySettingsResponse>> updateStudyDisplaySettings(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody UpdateStudyDisplaySettingsRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyDisplaySettingsResponse updated = studyService.updateStudyDisplaySettings(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Study display settings updated successfully", updated));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-tasks", "/studies/{studyId}/bulk-tasks"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> getStudyBulkTasks(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse response = studyService.getStudyBulkTasks(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-task-groups", "/studies/{studyId}/bulk-task-groups"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> createBulkTaskGroup(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody SaveBulkTaskGroupRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse created = studyService.createBulkTaskGroup(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Bulk task group created successfully", created));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-task-groups/{groupId}", "/studies/{studyId}/bulk-task-groups/{groupId}"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> updateBulkTaskGroup(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String groupId,
            @Valid @RequestBody SaveBulkTaskGroupRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse updated = studyService.updateBulkTaskGroup(
                    effectiveTenantId,
                    studyId,
                    groupId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Bulk task group updated successfully", updated));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @DeleteMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-task-groups/{groupId}", "/studies/{studyId}/bulk-task-groups/{groupId}"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> deleteBulkTaskGroup(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String groupId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse remaining = studyService.deleteBulkTaskGroup(
                    effectiveTenantId,
                    studyId,
                    groupId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Bulk task group deleted successfully", remaining));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-task-groups/{groupId}/tasks", "/studies/{studyId}/bulk-task-groups/{groupId}/tasks"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> createBulkTask(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String groupId,
            @Valid @RequestBody SaveBulkTaskRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse created = studyService.createBulkTask(
                    effectiveTenantId,
                    studyId,
                    groupId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Bulk task created successfully", created));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-tasks/{taskId}", "/studies/{studyId}/bulk-tasks/{taskId}"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> updateBulkTask(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String taskId,
            @Valid @RequestBody SaveBulkTaskRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse updated = studyService.updateBulkTask(
                    effectiveTenantId,
                    studyId,
                    taskId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Bulk task updated successfully", updated));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @DeleteMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-tasks/{taskId}", "/studies/{studyId}/bulk-tasks/{taskId}"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> deleteBulkTask(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String taskId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse remaining = studyService.deleteBulkTask(
                    effectiveTenantId,
                    studyId,
                    taskId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Bulk task deleted successfully", remaining));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/bulk-task-groups/{groupId}/tasks/order", "/studies/{studyId}/bulk-task-groups/{groupId}/tasks/order"})
    public ResponseEntity<ApiResponse<StudyBulkTasksResponse>> reorderBulkTasks(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String groupId,
            @Valid @RequestBody ReorderBulkTasksRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyBulkTasksResponse reordered = studyService.reorderBulkTasks(
                    effectiveTenantId,
                    studyId,
                    groupId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Bulk tasks reordered successfully", reordered));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    private boolean resolveCanManageSiteAdmins(UUID effectiveTenantId) {
        if (siteAuthorizationService != null) {
            Optional<com.enrollnow.identity.dtos.UserEffectivePermissionsResponse> effectiveOpt =
                    siteAuthorizationService.getCallerEffectivePermissions(effectiveTenantId, null);
            if (effectiveOpt.isPresent()) {
                return effectiveOpt.get().isCanManageSiteAdmins()
                        || effectiveOpt.get().isCanAccessSiteAdmin()
                        || effectiveOpt.get().getPermissions().contains(com.enrollnow.identity.services.SitePermissionService.PERM_SITE_ALL_STUDIES_MANAGE);
            }
        }
        return false;
    }

    // --- Study Settings: Email & Text Templates ---

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/email-text-settings", "/studies/{studyId}/email-text-settings"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> getStudyEmailTextSettings(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.getStudyEmailTextSettings(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/email-templates", "/studies/{studyId}/email-templates"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> createEmailTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody SaveEmailTemplateRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.createEmailTemplate(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Email template created successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/email-templates/{templateId}", "/studies/{studyId}/email-templates/{templateId}"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> updateEmailTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId,
            @Valid @RequestBody SaveEmailTemplateRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.updateEmailTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Email template updated successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/email-templates/{templateId}/copy", "/studies/{studyId}/email-templates/{templateId}/copy"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> copyEmailTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.copyEmailTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Email template copied successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/email-templates/{templateId}/archive", "/studies/{studyId}/email-templates/{templateId}/archive"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> archiveEmailTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.archiveEmailTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Email template archived successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/email-templates/{templateId}/restore", "/studies/{studyId}/email-templates/{templateId}/restore"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> restoreEmailTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.restoreEmailTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Email template restored successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @DeleteMapping({"/tenants/{tenantId}/studies/{studyId}/email-templates/{templateId}", "/studies/{studyId}/email-templates/{templateId}"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> deleteEmailTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.deleteEmailTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Email template deleted successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/email-templates/order", "/studies/{studyId}/email-templates/order"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> reorderEmailTemplates(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody ReorderTemplatesRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.reorderEmailTemplates(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Email templates reordered successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/text-templates", "/studies/{studyId}/text-templates"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> createTextTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody SaveTextTemplateRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.createTextTemplate(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Text template created successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/text-templates/{templateId}", "/studies/{studyId}/text-templates/{templateId}"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> updateTextTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId,
            @Valid @RequestBody SaveTextTemplateRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.updateTextTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Text template updated successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/text-templates/{templateId}/copy", "/studies/{studyId}/text-templates/{templateId}/copy"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> copyTextTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.copyTextTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Text template copied successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/text-templates/{templateId}/archive", "/studies/{studyId}/text-templates/{templateId}/archive"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> archiveTextTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.archiveTextTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Text template archived successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/text-templates/{templateId}/restore", "/studies/{studyId}/text-templates/{templateId}/restore"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> restoreTextTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.restoreTextTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Text template restored successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @DeleteMapping({"/tenants/{tenantId}/studies/{studyId}/text-templates/{templateId}", "/studies/{studyId}/text-templates/{templateId}"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> deleteTextTemplate(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String templateId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.deleteTextTemplate(
                    effectiveTenantId,
                    studyId,
                    templateId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Text template deleted successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/text-templates/order", "/studies/{studyId}/text-templates/order"})
    public ResponseEntity<ApiResponse<StudyEmailTextSettingsResponse>> reorderTextTemplates(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody ReorderTemplatesRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyEmailTextSettingsResponse response = studyService.reorderTextTemplates(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Text templates reordered successfully", response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/requirements", "/studies/{studyId}/requirements"})
    public ResponseEntity<ApiResponse<StudyRequirementsResponse>> getStudyRequirements(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyRequirementsResponse response = studyService.getStudyRequirements(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/requirements", "/studies/{studyId}/requirements"})
    public ResponseEntity<ApiResponse<StudyRequirementsResponse>> updateStudyRequirements(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody UpdateStudyRequirementsRequest request
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyRequirementsResponse updated = studyService.updateStudyRequirements(
                    effectiveTenantId,
                    studyId,
                    request,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Study requirements updated successfully", updated));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "BAD_REQUEST", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/milestones", "/studies/{studyId}/milestones"})
    public ResponseEntity<ApiResponse<StudyMilestoneDto>> addStudyMilestone(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @Valid @RequestBody StudyMilestoneDto dto
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyMilestoneDto created = studyService.addStudyMilestone(
                    effectiveTenantId,
                    studyId,
                    dto,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Milestone created successfully", created));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "BAD_REQUEST", ex.getMessage()));
        }
    }

    @PutMapping({"/tenants/{tenantId}/studies/{studyId}/milestones/{milestoneId}", "/studies/{studyId}/milestones/{milestoneId}"})
    public ResponseEntity<ApiResponse<StudyMilestoneDto>> updateStudyMilestone(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String milestoneId,
            @Valid @RequestBody StudyMilestoneDto dto
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyMilestoneDto updated = studyService.updateStudyMilestone(
                    effectiveTenantId,
                    studyId,
                    milestoneId,
                    dto,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Milestone updated successfully", updated));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "BAD_REQUEST", ex.getMessage()));
        }
    }

    @DeleteMapping({"/tenants/{tenantId}/studies/{studyId}/milestones/{milestoneId}", "/studies/{studyId}/milestones/{milestoneId}"})
    public ResponseEntity<ApiResponse<Void>> deleteStudyMilestone(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String milestoneId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            studyService.deleteStudyMilestone(
                    effectiveTenantId,
                    studyId,
                    milestoneId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success("Milestone deleted successfully", null));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping({"/tenants/{tenantId}/studies/{studyId}/global-variables", "/studies/{studyId}/global-variables"})
    public ResponseEntity<ApiResponse<List<StudyCustomVariableDto>>> getGlobalCustomVariables(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            List<StudyCustomVariableDto> vars = studyService.getGlobalCustomVariables(
                    effectiveTenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.ok(ApiResponse.success(vars));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/global-variables/{variableId}", "/studies/{studyId}/global-variables/{variableId}"})
    public ResponseEntity<ApiResponse<StudyCustomVariableDto>> addGlobalVariableToStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId,
            @PathVariable String variableId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        UUID callerUserId = resolveCallerUserId();
        boolean canManageSiteAdmins = resolveCanManageSiteAdmins(effectiveTenantId);

        try {
            StudyCustomVariableDto added = studyService.addGlobalVariableToStudy(
                    effectiveTenantId,
                    studyId,
                    variableId,
                    callerUserId,
                    canManageSiteAdmins
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Global variable added to study successfully", added));
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "BAD_REQUEST", ex.getMessage()));
        }
    }

    private UUID resolveCallerUserId() {
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new org.springframework.security.authentication.InsufficientAuthenticationException("Authentication is required to access Study resources"));
        if (caller.userId() != null) {
            return caller.userId();
        }
        throw new org.springframework.security.access.AccessDeniedException("Authenticated caller has no user ID");
    }

    private UUID resolveTenantId(UUID queryTenantId) {
        siteAuthorizationService.requireTenantMatch(queryTenantId);
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new org.springframework.security.authentication.InsufficientAuthenticationException("Authentication is required to access Study resources"));
        if (caller.tenantId() != null) {
            if (queryTenantId != null && !caller.tenantId().equals(queryTenantId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: cross-tenant operation is not permitted");
            }
            return caller.tenantId();
        }
        if (queryTenantId != null) {
            return queryTenantId;
        }
        throw new org.springframework.security.access.AccessDeniedException("Authenticated caller is not associated with any tenant");
    }
}
