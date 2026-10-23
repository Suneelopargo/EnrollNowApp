package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.CopyStudyRequest;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.ImportStudyResponse;
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
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        UUID callerUserId = resolveCallerUserId();
        CreateStudyRequest request = mapToCreateRequest(payload);

        StudySummaryResponse saved = studyService.createStudy(effectiveTenantId, request, callerUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study created successfully", saved));
    }

    @PostMapping({"/tenants/{tenantId}/studies/copy", "/studies/copy"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> copyStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        UUID callerUserId = resolveCallerUserId();
        CopyStudyRequest request = mapToCopyRequest(payload);

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
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        UUID callerUserId = resolveCallerUserId();

        if (payload == null || payload.isEmpty()) {
            throw new InvalidStudyException("Request body must provide JSON study import data.");
        }

        String studyName = payload.get("studyName") != null ? String.valueOf(payload.get("studyName"))
                : payload.get("shortName") != null ? String.valueOf(payload.get("shortName"))
                : payload.get("name") != null ? String.valueOf(payload.get("name")) : null;

        Map<String, Object> studyData = null;
        if (payload.get("studyData") instanceof Map<?, ?> sm) {
            studyData = (Map<String, Object>) sm;
        } else if (payload.get("data") instanceof Map<?, ?> dm) {
            studyData = (Map<String, Object>) dm;
        } else {
            studyData = payload;
        }

        if (studyName == null && studyData.get("study") instanceof Map<?, ?> stMap && stMap.get("name") != null) {
            studyName = String.valueOf(stMap.get("name")).trim();
        } else if (studyName == null && studyData.get("studyName") != null) {
            studyName = String.valueOf(studyData.get("studyName")).trim();
        }

        if (studyName == null || studyName.isBlank()) {
            throw new InvalidStudyException("Must provide a study name to import a new study.");
        }

        ImportStudyResponse response = studyService.importStudy(effectiveTenantId, studyName, studyData, callerUserId);
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

    @PostMapping({"/tenants/{tenantId}/studies/{studyId}/archive", "/studies/{studyId}/archive"})
    public ResponseEntity<ApiResponse<StudySummaryResponse>> archiveStudy(
            @PathVariable(name = "tenantId", required = false) UUID tenantId,
            @PathVariable String studyId
    ) {
        UUID effectiveTenantId = resolveTenantId(tenantId);
        if (siteAuthorizationService != null) {
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
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
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
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
            siteAuthorizationService.requireStudyCreateAccess(effectiveTenantId);
        }

        try {
            studyService.deleteStudy(effectiveTenantId, studyId);
            return ResponseEntity.ok(ApiResponse.success("Study deleted successfully", null));
        } catch (StudyNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "STUDY_NOT_FOUND", ex.getMessage()));
        }
    }

    private CreateStudyRequest mapToCreateRequest(Map<String, Object> body) {
        if (body == null) {
            return new CreateStudyRequest();
        }
        String name = body.get("shortName") != null ? String.valueOf(body.get("shortName"))
                : body.get("name") != null ? String.valueOf(body.get("name"))
                : body.get("title") != null ? String.valueOf(body.get("title")) : "New Study";
        String code = body.get("studyCode") != null ? String.valueOf(body.get("studyCode"))
                : body.get("protocolNumber") != null ? String.valueOf(body.get("protocolNumber"))
                : null;
        String description = body.get("description") != null ? String.valueOf(body.get("description")) : "";
        Integer sampleSize = null;
        if (body.get("sampleSize") instanceof Number n) {
            sampleSize = n.intValue();
        } else if (body.get("targetEnrollment") instanceof Number n) {
            sampleSize = n.intValue();
        }

        return new CreateStudyRequest(name, code, description, sampleSize);
    }

    private CopyStudyRequest mapToCopyRequest(Map<String, Object> body) {
        if (body == null) {
            return new CopyStudyRequest();
        }
        String studyName = body.get("shortName") != null ? String.valueOf(body.get("shortName"))
                : body.get("studyName") != null ? String.valueOf(body.get("studyName"))
                : body.get("name") != null ? String.valueOf(body.get("name"))
                : body.get("title") != null ? String.valueOf(body.get("title")) : "";

        String sourceId = body.get("templateId") != null ? String.valueOf(body.get("templateId"))
                : body.get("sourceStudyId") != null ? String.valueOf(body.get("sourceStudyId"))
                : body.get("idOfStudyToCopy") != null ? String.valueOf(body.get("idOfStudyToCopy")) : "";

        return new CopyStudyRequest(studyName, sourceId);
    }

    private UpdateStudyRequest mapToUpdateRequest(Map<String, Object> body) {
        if (body == null) {
            return new UpdateStudyRequest();
        }
        String name = body.containsKey("name") ? String.valueOf(body.get("name"))
                : body.containsKey("title") ? String.valueOf(body.get("title"))
                : body.containsKey("shortName") ? String.valueOf(body.get("shortName")) : null;
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
