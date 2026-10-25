package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.dtos.StudyNavigationPermissionsResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.services.MyStudiesService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyControllerTest {

    @Mock
    private StudyRepository studyRepository;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    @Mock
    private MyStudiesService myStudiesService;

    private StudyController studyController;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID studyId = UUID.fromString("33333333-3333-3333-3333-333333333301");
    private final UUID otherStudyId = UUID.fromString("33333333-3333-3333-3333-333333333302");
    private final UUID userId = UUID.fromString("c6fc38aa-916d-4dfc-9630-2f1bee41d551");

    @BeforeEach
    void setUp() {
        studyController = new StudyController(studyRepository, siteAuthorizationService, myStudiesService);
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
        study1.setStudyCode("REG_AD_MCI");
        study1.setName("REG - AD/MCI");
        study1.setArchived(false);

        Study study2 = new Study();
        study2.setId(otherStudyId);
        study2.setStudyCode("REG_HIV");
        study2.setName("REG - HIV");
        study2.setArchived(false);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study1, study2));

        MyStudyResponse assigned = new MyStudyResponse(studyId, "REG_AD_MCI", "REG - AD/MCI", "Coordinator", "STUDY_ADMIN");
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of(assigned));

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
        study1.setStudyCode("REG_AD_MCI");
        study1.setName("REG - AD/MCI");
        study1.setArchived(false);

        Study study2 = new Study();
        study2.setId(otherStudyId);
        study2.setStudyCode("REG_HIV");
        study2.setName("REG - HIV");
        study2.setArchived(false);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study1, study2));

        MyStudyResponse assigned = new MyStudyResponse(studyId, "REG_AD_MCI", "REG - AD/MCI", "Coordinator", "STUDY_ADMIN");
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of(assigned));

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
        study.setStudyCode("PROTO-200");
        study.setName("Neuro Study");
        study.setArchived(false);

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
    void getStudyNavigationPermissions_notFound_returns404() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<StudyNavigationPermissionsResponse>> response =
                studyController.getStudyNavigationPermissions(tenantId, studyId.toString());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }
}
