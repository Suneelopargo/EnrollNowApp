package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.dtos.ReorderBulkTasksRequest;
import com.enrollnow.study.dtos.SaveBulkTaskGroupRequest;
import com.enrollnow.study.dtos.SaveBulkTaskRequest;
import com.enrollnow.study.dtos.StudyBulkTasksResponse;
import com.enrollnow.study.dtos.StudyDetailsResponse;
import com.enrollnow.study.dtos.StudyDisplaySettingsResponse;
import com.enrollnow.study.dtos.StudyNavigationPermissionsResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyDetailsRequest;
import com.enrollnow.study.dtos.UpdateStudyDisplaySettingsRequest;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.services.StudyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyControllerTest {

    @Mock
    private StudyRepository studyRepository;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    private StudyController studyController;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID studyId = UUID.fromString("33333333-3333-3333-3333-333333333301");
    private final UUID otherStudyId = UUID.fromString("33333333-3333-3333-3333-333333333302");
    private final UUID userId = UUID.fromString("c6fc38aa-916d-4dfc-9630-2f1bee41d551");

    @BeforeEach
    void setUp() {
        StudyService studyService = new StudyService(
                studyRepository,
                null,
                studyMemberRepository,
                roleRepository,
                userRoleAssignmentRepository,
                null,
                null
        );
        studyController = new StudyController(studyService, siteAuthorizationService, new com.fasterxml.jackson.databind.ObjectMapper());
        SiteAuthorizationService.CallerIdentity caller = new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        lenient().when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));
        UserEffectivePermissionsResponse adminEffective = new UserEffectivePermissionsResponse();
        adminEffective.setUserId(userId);
        adminEffective.setCanManageSiteAdmins(true);
        adminEffective.setCanAccessSiteAdmin(true);
        adminEffective.setPermissions(List.of(com.enrollnow.identity.services.SitePermissionService.PERM_SITE_ALL_STUDIES_MANAGE));
        lenient().when(siteAuthorizationService.getCallerEffectivePermissions(any(), any())).thenReturn(Optional.of(adminEffective));
    }

    @Test
    void getStudies_withTenantIdInPath_returnsStudiesForTenant() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("PROTO-101");
        study.setName("Cardiology Trial");
        study.setArchived(false);
        study.setSampleSize(150);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study));

        ResponseEntity<ApiResponse<List<StudySummaryResponse>>> response =
                studyController.getStudies(tenantId, false);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        StudySummaryResponse item = response.getBody().getData().get(0);
        assertEquals("PROTO-101", item.getStudyCode());
        assertEquals("Cardiology Trial", item.getName());
        assertEquals("Cardiology Trial", item.getTitle());
        assertEquals("ACTIVE", item.getStatus());
        assertEquals(150, item.getTargetEnrollment());
        verify(siteAuthorizationService).requireTenantMatch(tenantId);
    }

    @Test
    void getStudies_withTenantIdInPath_nonSiteAdmin_filtersToAssignedStudies() {
        UserEffectivePermissionsResponse effective = new UserEffectivePermissionsResponse();
        effective.setUserId(userId);
        effective.setSiteRole("SITE_MANAGER");
        effective.setCanManageSiteAdmins(false);
        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null)).thenReturn(Optional.of(effective));

        Study study1 = new Study();
        study1.setId(studyId);
        study1.setTenantId(tenantId);
        study1.setStudyCode("REG_AD_MCI");
        study1.setName("REG - AD/MCI");
        study1.setArchived(false);

        Study study2 = new Study();
        study2.setId(otherStudyId);
        study2.setTenantId(tenantId);
        study2.setStudyCode("REG_HIV");
        study2.setName("REG - HIV");
        study2.setArchived(false);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study1, study2));
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study1));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setTenantId(tenantId);
        member.setActive(true);
        member.setStudyRole("Coordinator");
        when(studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of(member));

        ResponseEntity<ApiResponse<List<StudySummaryResponse>>> response =
                studyController.getStudies(tenantId, false);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("REG_AD_MCI", response.getBody().getData().get(0).getStudyCode());
        verify(siteAuthorizationService).requireTenantMatch(tenantId);
    }

    @Test
    void getStudies_withoutTenantIdInPath_resolvesCallerTenantFromAuthContext() {
        SiteAuthorizationService.CallerIdentity caller =
                new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));

        UserEffectivePermissionsResponse effective = new UserEffectivePermissionsResponse();
        effective.setUserId(userId);
        effective.setCanManageSiteAdmins(true);
        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null)).thenReturn(Optional.of(effective));

        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("PROTO-202");
        study.setName("Oncology Study");
        study.setArchived(false);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study));

        ResponseEntity<ApiResponse<List<StudySummaryResponse>>> response =
                studyController.getStudies(null, false);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("PROTO-202", response.getBody().getData().get(0).getStudyCode());
    }

    @Test
    void getStudies_withoutTenantIdInPath_nonSiteAdmin_filtersToAssignedStudies() {
        SiteAuthorizationService.CallerIdentity caller =
                new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));

        UserEffectivePermissionsResponse effective = new UserEffectivePermissionsResponse();
        effective.setUserId(userId);
        effective.setSiteRole("SITE_MANAGER");
        effective.setCanManageSiteAdmins(false);
        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null)).thenReturn(Optional.of(effective));

        Study study1 = new Study();
        study1.setId(studyId);
        study1.setTenantId(tenantId);
        study1.setStudyCode("REG_AD_MCI");
        study1.setName("REG - AD/MCI");
        study1.setArchived(false);

        Study study2 = new Study();
        study2.setId(otherStudyId);
        study2.setTenantId(tenantId);
        study2.setStudyCode("REG_HIV");
        study2.setName("REG - HIV");
        study2.setArchived(false);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study1, study2));
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study1));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setTenantId(tenantId);
        member.setActive(true);
        member.setStudyRole("Coordinator");
        when(studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of(member));

        ResponseEntity<ApiResponse<List<StudySummaryResponse>>> response =
                studyController.getStudies(null, false);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("REG_AD_MCI", response.getBody().getData().get(0).getStudyCode());
        assertEquals("REG - AD/MCI", response.getBody().getData().get(0).getName());
    }

    @Test
    void getStudyById_found_returnsStudy() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("PROTO-101");
        study.setName("Cardiology Trial");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        ResponseEntity<ApiResponse<StudySummaryResponse>> response =
                studyController.getStudyById(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("PROTO-101", response.getBody().getData().getStudyCode());
    }

    @Test
    void getStudyById_notFound_returns404() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<StudySummaryResponse>> response =
                studyController.getStudyById(tenantId, studyId.toString());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void createStudy_savesAndReturnsCreatedStudy() {
        Study savedStudy = new Study();
        savedStudy.setId(studyId);
        savedStudy.setName("Neurology Study");
        savedStudy.setStudyCode("NEURO-01");
        savedStudy.setSampleSize(200);

        when(studyRepository.save(any(Study.class))).thenReturn(savedStudy);

        CreateStudyRequest request = new CreateStudyRequest("Neurology Study", "NEURO-01", "Phase II Alzheimer study", null);

        ResponseEntity<ApiResponse<StudySummaryResponse>> response =
                studyController.createStudy(tenantId, request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Neurology Study", response.getBody().getData().getTitle());
        assertEquals("NEURO-01", response.getBody().getData().getProtocolNumber());
    }

    @Test
    void updateStudy_enforcesStudyManageAccess() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setName("Existing");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRepository.save(any(Study.class))).thenAnswer(i -> i.getArgument(0));

        com.enrollnow.study.dtos.UpdateStudyRequest updateReq =
                new com.enrollnow.study.dtos.UpdateStudyRequest("Updated Study", "Desc", false, 150);

        ResponseEntity<ApiResponse<StudySummaryResponse>> response =
                studyController.updateStudy(tenantId, studyId.toString(), updateReq);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(siteAuthorizationService).requireStudyManageAccess(tenantId);
    }

    @Test
    void archiveStudy_enforcesStudyManageAccess() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setName("Existing");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRepository.save(any(Study.class))).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<ApiResponse<StudySummaryResponse>> response =
                studyController.archiveStudy(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(siteAuthorizationService).requireStudyManageAccess(tenantId);
    }

    @Test
    void deleteStudy_enforcesStudyManageAccess() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setName("Existing");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));

        ResponseEntity<ApiResponse<Void>> response =
                studyController.deleteStudy(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(siteAuthorizationService).requireStudyManageAccess(tenantId);
        verify(studyRepository).delete(existing);
    }

    @Test
    void getStudyNavigationPermissions_found_returnsOkWithPermissions() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setStudyCode("PROTO-200");
        study.setName("Neuro Study");
        study.setArchived(false);

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setTenantId(tenantId);
        member.setActive(true);
        member.setStudyRole("Coordinator");

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, userId))
                .thenReturn(Optional.of(member));
        when(studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(member));
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        ResponseEntity<ApiResponse<StudyNavigationPermissionsResponse>> response =
                studyController.getStudyNavigationPermissions(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());

        StudyNavigationPermissionsResponse data = response.getBody().getData();
        assertEquals(studyId, data.getStudyId());
        assertEquals("PROTO-200", data.getStudyCode());
        assertEquals("Neuro Study", data.getStudyName());
        assertNotNull(data.getPermissions());
        assertTrue(data.getPermissions().contains("STUDY_DASHBOARD_READ"));
    }

    @Test
    void getStudyNavigationPermissions_unauthorized_returns403() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Private Study");

        UserEffectivePermissionsResponse nonAdmin = new UserEffectivePermissionsResponse();
        nonAdmin.setUserId(userId);
        nonAdmin.setCanManageSiteAdmins(false);
        nonAdmin.setCanAccessSiteAdmin(false);
        nonAdmin.setPermissions(List.of());
        when(siteAuthorizationService.getCallerEffectivePermissions(any(), any())).thenReturn(Optional.of(nonAdmin));

        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        ResponseEntity<ApiResponse<StudyNavigationPermissionsResponse>> response =
                studyController.getStudyNavigationPermissions(tenantId, studyId.toString());

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void getStudyNavigationPermissions_unauthenticated_returns401() {
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<StudyNavigationPermissionsResponse>> response =
                studyController.getStudyNavigationPermissions(tenantId, studyId.toString());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void getStudyNavigationPermissions_notFound_returns404() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<StudyNavigationPermissionsResponse>> response =
                studyController.getStudyNavigationPermissions(tenantId, studyId.toString());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void getStudyDetails_success() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Detail Study");
        study.setStudyCode("DET-01");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        ResponseEntity<ApiResponse<StudyDetailsResponse>> response =
                studyController.getStudyDetails(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Detail Study", response.getBody().getData().getName());
    }

    @Test
    void updateStudyDetails_success() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("OldName");
        study.setStudyCode("DET-01");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(studyRepository.save(any(Study.class))).thenAnswer(inv -> inv.getArgument(0));

        // Site admin authorized caller
        UserEffectivePermissionsResponse perms = new UserEffectivePermissionsResponse();
        perms.setUserId(userId);
        perms.setTenantId(tenantId);
        perms.setCanManageSiteAdmins(true);
        perms.setCanAccessSiteAdmin(true);
        perms.setPermissions(List.of("SITE_ALL_STUDIES_MANAGE"));

        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null))
                .thenReturn(Optional.of(perms));

        UpdateStudyDetailsRequest request = new UpdateStudyDetailsRequest(
                "NewName", "Long Title", "Desc", "IRB-123",
                null, null, null, true, "Portal", "https://portal.org", null
        );

        ResponseEntity<ApiResponse<StudyDetailsResponse>> response =
                studyController.updateStudyDetails(tenantId, studyId.toString(), request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("NewName", response.getBody().getData().getName());
    }

    @Test
    void exportStudy_success() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("ExportStudy");
        study.setStudyCode("EXP-01");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UserEffectivePermissionsResponse perms = new UserEffectivePermissionsResponse();
        perms.setUserId(userId);
        perms.setTenantId(tenantId);
        perms.setCanManageSiteAdmins(true);
        perms.setCanAccessSiteAdmin(true);
        perms.setPermissions(List.of("SITE_ALL_STUDIES_MANAGE"));

        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null))
                .thenReturn(Optional.of(perms));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                studyController.exportStudy(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("2.0", response.getBody().getData().get("version"));
    }

    // =========================================================================
    // Display Settings & Bulk Tasks Endpoint Tests
    // =========================================================================

    @Test
    void getStudyDisplaySettings_success() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Display Study");
        study.setLocale("en-US");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UserEffectivePermissionsResponse perms = new UserEffectivePermissionsResponse();
        perms.setUserId(userId);
        perms.setTenantId(tenantId);
        perms.setCanManageSiteAdmins(true);
        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null)).thenReturn(Optional.of(perms));

        ResponseEntity<ApiResponse<StudyDisplaySettingsResponse>> response =
                studyController.getStudyDisplaySettings(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("en-US", response.getBody().getData().getLocale());
    }

    @Test
    void updateStudyDisplaySettings_success() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Display Study");
        study.setLocale("en-US");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(studyRepository.save(any(Study.class))).thenAnswer(inv -> inv.getArgument(0));

        UserEffectivePermissionsResponse perms = new UserEffectivePermissionsResponse();
        perms.setUserId(userId);
        perms.setTenantId(tenantId);
        perms.setCanManageSiteAdmins(true);
        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null)).thenReturn(Optional.of(perms));

        UpdateStudyDisplaySettingsRequest req = new UpdateStudyDisplaySettingsRequest();
        req.setLocale("es-ES");
        req.setShowGlobalComments(true);

        ResponseEntity<ApiResponse<StudyDisplaySettingsResponse>> response =
                studyController.updateStudyDisplaySettings(tenantId, studyId.toString(), req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("es-ES", response.getBody().getData().getLocale());
        assertTrue(response.getBody().getData().isShowGlobalComments());
    }

    @Test
    void getStudyBulkTasks_success() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Bulk Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UserEffectivePermissionsResponse perms = new UserEffectivePermissionsResponse();
        perms.setUserId(userId);
        perms.setTenantId(tenantId);
        perms.setCanManageSiteAdmins(true);
        when(siteAuthorizationService.getCallerEffectivePermissions(tenantId, null)).thenReturn(Optional.of(perms));

        ResponseEntity<ApiResponse<StudyBulkTasksResponse>> response =
                studyController.getStudyBulkTasks(tenantId, studyId.toString());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(studyId.toString(), response.getBody().getData().getStudyId());
    }

    @Test
    void getStudyDisplaySettings_notFound_returns404() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<StudyDisplaySettingsResponse>> response =
                studyController.getStudyDisplaySettings(tenantId, studyId.toString());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void getStudyBulkTasks_notFound_returns404() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<StudyBulkTasksResponse>> response =
                studyController.getStudyBulkTasks(tenantId, studyId.toString());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void getStudies_authenticatedCallerWithoutTenantClaim_throwsAccessDeniedEvenWithRequestTenantId() {
        SiteAuthorizationService.CallerIdentity callerWithoutTenant =
                new SiteAuthorizationService.CallerIdentity(userId, null);
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(callerWithoutTenant));

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyController.getStudies(tenantId, false)
        );
        verify(studyRepository, never()).findByTenantIdAndArchivedFalse(any());
        verify(studyRepository, never()).findByTenantId(any());
    }

    @Test
    void getStudies_crossTenantRequest_throwsAccessDenied() {
        UUID otherTenantId = UUID.randomUUID();
        SiteAuthorizationService.CallerIdentity caller =
                new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyController.getStudies(otherTenantId, false)
        );
        verify(studyRepository, never()).findByTenantIdAndArchivedFalse(any());
    }

    // =========================================================================
    // Consolidated MyStudies Endpoint (getMyStudies) Tests
    // =========================================================================

    @Test
    void getMyStudies_withTenantIdInPath_returnsAssignedStudies() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setStudyCode("MY-101");
        study.setName("My Assigned Study");

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setTenantId(tenantId);
        member.setActive(true);
        member.setStudyRole("Coordinator");

        UUID roleId = UUID.randomUUID();
        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setTenantId(tenantId);
        assignment.setUserId(userId);
        assignment.setStudyId(studyId);
        assignment.setRoleId(roleId);
        assignment.setActive(true);

        Role adminRole = new Role();
        adminRole.setId(roleId);
        adminRole.setCode("STUDY_ADMIN");
        adminRole.setName("Study Admin");

        when(studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of(member));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of(assignment));
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(adminRole));
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        ResponseEntity<List<MyStudyResponse>> response = studyController.getMyStudies(tenantId, userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        MyStudyResponse item = response.getBody().get(0);
        assertEquals(studyId, item.getId());
        assertEquals("MY-101", item.getCode());
        assertEquals("My Assigned Study", item.getName());
        assertEquals("Coordinator", item.getStudyRole());
        assertEquals("STUDY_ADMIN", item.getStudyPermission());
        verify(siteAuthorizationService).requireTenantMatch(tenantId);
        verify(siteAuthorizationService).requireSelfOrUserViewAccess(tenantId, userId, null);
    }

    @Test
    void getMyStudies_withoutTenantIdInPath_resolvesCallerTenantAndReturnsStudies() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setStudyCode("MY-202");
        study.setName("Direct User Studies");

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setTenantId(tenantId);
        member.setActive(true);
        member.setStudyRole("Investigator");

        when(studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of(member));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of());
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        ResponseEntity<List<MyStudyResponse>> response = studyController.getMyStudies(null, userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("MY-202", response.getBody().get(0).getCode());
        verify(siteAuthorizationService).requireSelfOrUserViewAccess(tenantId, userId, null);
    }

    @Test
    void getMyStudies_emptyAssignments_returnsEmptyList() {
        when(studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of());

        ResponseEntity<List<MyStudyResponse>> response = studyController.getMyStudies(tenantId, userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void getMyStudies_unauthorizedAccessToAnotherUsersStudies_throwsAccessDenied() {
        UUID otherUserId = UUID.randomUUID();
        doThrow(new org.springframework.security.access.AccessDeniedException("Access denied"))
                .when(siteAuthorizationService).requireSelfOrUserViewAccess(tenantId, otherUserId, null);

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyController.getMyStudies(tenantId, otherUserId)
        );
        verifyNoInteractions(studyMemberRepository, userRoleAssignmentRepository, studyRepository);
    }

    @Test
    void getMyStudies_crossTenantAccessAttempt_throwsAccessDenied() {
        UUID otherTenantId = UUID.randomUUID();

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyController.getMyStudies(otherTenantId, userId)
        );
        verifyNoInteractions(studyMemberRepository, userRoleAssignmentRepository, studyRepository);
    }

    @Test
    void getMyStudies_unauthenticatedCaller_throwsInsufficientAuthenticationException() {
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.empty());

        assertThrows(
                org.springframework.security.authentication.InsufficientAuthenticationException.class,
                () -> studyController.getMyStudies(tenantId, userId)
        );
        verifyNoInteractions(studyMemberRepository, userRoleAssignmentRepository, studyRepository);
    }

    @Test
    void getMyStudies_missingUserId_throwsAccessDenied() {
        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyController.getMyStudies(tenantId, null)
        );
        verifyNoInteractions(studyMemberRepository, userRoleAssignmentRepository, studyRepository);
    }
}
