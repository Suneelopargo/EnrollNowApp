package com.enrollnow.study.services;

import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.dtos.StudyDetailsResponse;
import com.enrollnow.study.dtos.StudyGrantDto;
import com.enrollnow.study.dtos.StudyNavigationPermissionsResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyDetailsRequest;
import com.enrollnow.study.dtos.UpdateStudyRequest;
import com.enrollnow.study.exceptions.DuplicateStudyNameException;
import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyGrant;
import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.repositories.StudyGrantRepository;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyServiceTest {

    @Mock
    private StudyRepository studyRepository;

    @Mock
    private MyStudiesService myStudiesService;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private StudyGrantRepository studyGrantRepository;

    @Mock
    private StudyConfigurationService studyConfigurationService;

    @Mock
    private StudyRequirementRepository studyRequirementRepository;

    private StudyService studyService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        studyService = new StudyService(
                studyRepository,
                myStudiesService,
                studyConfigurationService,
                studyMemberRepository,
                roleRepository,
                userRoleAssignmentRepository,
                null,
                null
        );
        studyService.setStudyMemberRepository(studyMemberRepository);
        studyService.setUserRepository(userRepository);
        studyService.setStudyGrantRepository(studyGrantRepository);
        studyService.setStudyRequirementRepository(studyRequirementRepository);
    }

    @Test
    void getStudies_filtersByAssignedForNonAdmin() {
        Study study1 = new Study();
        study1.setId(studyId);
        study1.setName("Study One");
        study1.setStudyCode("S1");
        study1.setArchived(false);

        UUID otherId = UUID.randomUUID();
        Study study2 = new Study();
        study2.setId(otherId);
        study2.setName("Study Two");
        study2.setStudyCode("S2");
        study2.setArchived(false);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study1, study2));

        MyStudyResponse assigned = new MyStudyResponse(studyId, "S1", "Study One", "Coordinator", "STUDY_MEMBER");
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of(assigned));

        List<StudySummaryResponse> result = studyService.getStudies(tenantId, false, userId, false);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("S1", result.get(0).getStudyCode());
        assertEquals("Study One", result.get(0).getName());
    }

    @Test
    void getStudyByIdOrCode_found_returnsSummary() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Oncology Trial");
        study.setStudyCode("ONC-100");
        study.setSampleSize(200);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        StudySummaryResponse res = studyService.getStudyByIdOrCode(tenantId, studyId.toString());

        assertNotNull(res);
        assertEquals("ONC-100", res.getStudyCode());
        assertEquals("Oncology Trial", res.getName());
        assertEquals(200, res.getSampleSize());
        assertNull(res.getEnrolled()); // Synthetic 65% enrollment removed - non-fabricated representation
    }

    @Test
    void getStudyByIdOrCode_notFound_throwsStudyNotFoundException() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        assertThrows(
                StudyNotFoundException.class,
                () -> studyService.getStudyByIdOrCode(tenantId, studyId.toString())
        );
        verify(studyRepository, never()).findById(any());
    }

    @Test
    void updateStudy_crossTenantStudyId_throwsStudyNotFoundAndDoesNotFallbackToGlobalFindById() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());
        when(studyRepository.findByTenantIdAndStudyCode(tenantId, studyId.toString())).thenReturn(Optional.empty());

        UpdateStudyRequest req = new UpdateStudyRequest("Hijacked Name", "Hijacked", true, 999);

        assertThrows(
                StudyNotFoundException.class,
                () -> studyService.updateStudy(tenantId, studyId.toString(), req)
        );
        verify(studyRepository, never()).findById(any());
        verify(studyRepository, never()).save(any());
    }

    @Test
    void createStudy_savesAndReturnsSummary() {
        CreateStudyRequest req = new CreateStudyRequest("Vaccine Trial", "VAC-01", "Phase 3 vaccine trial", 500);

        Study saved = new Study();
        saved.setId(studyId);
        saved.setTenantId(tenantId);
        saved.setName(req.getName());
        saved.setStudyCode(req.getStudyCode());
        saved.setDescription(req.getDescription());
        saved.setSampleSize(req.getSampleSize());

        when(studyRepository.save(any(Study.class))).thenReturn(saved);

        StudySummaryResponse res = studyService.createStudy(tenantId, req);

        assertNotNull(res);
        assertEquals("VAC-01", res.getStudyCode());
        assertEquals("Vaccine Trial", res.getName());
        assertEquals(500, res.getSampleSize());
        verify(studyRepository).save(any(Study.class));
    }

    @Test
    void updateStudy_updatesAndReturnsSummary() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setName("Old Name");
        existing.setStudyCode("STD-01");
        existing.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRepository.save(any(Study.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateStudyRequest req = new UpdateStudyRequest("Updated Name", "Updated Description", true, 300);

        StudySummaryResponse res = studyService.updateStudy(tenantId, studyId.toString(), req);

        assertNotNull(res);
        assertEquals("Updated Name", res.getName());
        assertTrue(res.isArchived());
        assertEquals(300, res.getSampleSize());
    }

    @Test
    void getStudyByIdOrCode_nonAdmin_unassigned_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Restricted Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of());

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyService.getStudyByIdOrCode(tenantId, studyId.toString(), userId, false)
        );
    }

    @Test
    void toSummaryResponseList_batchQueries_preventsNPlusOne() {
        Study study1 = new Study();
        study1.setId(studyId);
        study1.setName("Study 1");

        UUID otherId = UUID.randomUUID();
        Study study2 = new Study();
        study2.setId(otherId);
        study2.setName("Study 2");

        when(studyMemberRepository.findByIdStudyIdIn(anyCollection())).thenReturn(List.of());

        List<StudySummaryResponse> summaries = studyService.toSummaryResponseList(List.of(study1, study2));

        assertEquals(2, summaries.size());
        verify(studyMemberRepository, times(1)).findByIdStudyIdIn(anyCollection());
        verify(studyMemberRepository, never()).findByTenantIdAndIdStudyId(any(), any());
    }

    @Test
    void getStudyNavigationPermissions_1_validStudyAdminAssignment_returnsAdminRoleAndAllPermissions() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("ADM-001");
        study.setName("Admin Trial");
        study.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UUID roleId = UUID.randomUUID();
        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setUserId(userId);
        assignment.setStudyId(studyId);
        assignment.setRoleId(roleId);
        assignment.setActive(true);
        assignment.setEffectiveFrom(java.time.OffsetDateTime.now().minusDays(1));
        assignment.setEffectiveTo(java.time.OffsetDateTime.now().plusDays(30));

        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of(assignment));

        Role adminRole = new Role();
        adminRole.setId(roleId);
        adminRole.setCode("STUDY_ADMIN");
        adminRole.setName("Study Admin");
        adminRole.setScopeType("STUDY");
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(adminRole));

        StudyNavigationPermissionsResponse response = studyService.getStudyNavigationPermissions(
                tenantId,
                studyId.toString(),
                userId,
                false
        );

        assertNotNull(response);
        assertEquals(studyId, response.getStudyId());
        assertEquals("ADM-001", response.getStudyCode());
        assertEquals("Admin Trial", response.getStudyName());
        assertEquals("STUDY_ADMIN", response.getStudyPermission());
        assertEquals("Study Admin", response.getStudyRole());
        assertFalse(response.isArchived());
        assertEquals("ACTIVE", response.getStatus());

        List<String> perms = response.getPermissions();
        assertTrue(perms.contains("STUDY_DASHBOARD_READ"));
        assertTrue(perms.contains("TASK_READ"));
        assertTrue(perms.contains("RECRUITMENT_READ"));
        assertTrue(perms.contains("RECRUITMENT_MANAGE"));
        assertTrue(perms.contains("CALENDAR_READ"));
        assertTrue(perms.contains("POTENTIAL_PARTICIPANT_READ"));
        assertTrue(perms.contains("ENROLLED_PARTICIPANT_READ"));
        assertTrue(perms.contains("STUDY_SETTINGS_MANAGE"));
    }

    @Test
    void getStudyNavigationPermissions_2_validStudyLeaderAssignment_returnsLeaderPermissions() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("LEAD-001");
        study.setName("Leader Study");
        study.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UUID roleId = UUID.randomUUID();
        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setUserId(userId);
        assignment.setStudyId(studyId);
        assignment.setRoleId(roleId);
        assignment.setActive(true);
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of(assignment));

        Role leaderRole = new Role();
        leaderRole.setId(roleId);
        leaderRole.setCode("STUDY_LEADER");
        leaderRole.setName("Study Leader");
        leaderRole.setScopeType("STUDY");
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(leaderRole));

        StudyNavigationPermissionsResponse response = studyService.getStudyNavigationPermissions(
                tenantId,
                studyId.toString(),
                userId,
                false
        );

        assertNotNull(response);
        assertEquals("STUDY_LEADER", response.getStudyPermission());
        assertEquals("Study Leader", response.getStudyRole());

        List<String> perms = response.getPermissions();
        assertTrue(perms.contains("STUDY_DASHBOARD_READ"));
        assertTrue(perms.contains("TASK_READ"));
        assertTrue(perms.contains("RECRUITMENT_READ"));
        assertTrue(perms.contains("CALENDAR_READ"));
        assertTrue(perms.contains("POTENTIAL_PARTICIPANT_READ"));
        assertTrue(perms.contains("ENROLLED_PARTICIPANT_READ"));
        assertFalse(perms.contains("STUDY_SETTINGS_MANAGE"));
    }

    @Test
    void getStudyNavigationPermissions_3_validRaAssignment_returnsRaPermissions() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("RA-001");
        study.setName("RA Study");
        study.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UUID roleId = UUID.randomUUID();
        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setUserId(userId);
        assignment.setStudyId(studyId);
        assignment.setRoleId(roleId);
        assignment.setActive(true);
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of(assignment));

        Role raRole = new Role();
        raRole.setId(roleId);
        raRole.setCode("STUDY_RA");
        raRole.setName("Research Assistant");
        raRole.setScopeType("STUDY");
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(raRole));

        StudyNavigationPermissionsResponse response = studyService.getStudyNavigationPermissions(
                tenantId,
                studyId.toString(),
                userId,
                false
        );

        assertNotNull(response);
        assertEquals("STUDY_RA", response.getStudyPermission());
        List<String> perms = response.getPermissions();
        assertTrue(perms.contains("STUDY_DASHBOARD_READ"));
        assertTrue(perms.contains("TASK_READ"));
        assertTrue(perms.contains("RECRUITMENT_READ"));
        assertTrue(perms.contains("CALENDAR_READ"));
        assertFalse(perms.contains("POTENTIAL_PARTICIPANT_READ"));
        assertFalse(perms.contains("ENROLLED_PARTICIPANT_READ"));
        assertFalse(perms.contains("STUDY_SETTINGS_MANAGE"));
    }

    @Test
    void getStudyNavigationPermissions_4_validReadOnlyAssignment_returnsReadOnlyPermissions() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("RO-001");
        study.setName("ReadOnly Study");
        study.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UUID roleId = UUID.randomUUID();
        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setUserId(userId);
        assignment.setStudyId(studyId);
        assignment.setRoleId(roleId);
        assignment.setActive(true);
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of(assignment));

        Role roRole = new Role();
        roRole.setId(roleId);
        roRole.setCode("STUDY_READ_ONLY");
        roRole.setName("Auditor");
        roRole.setScopeType("STUDY");
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(roRole));

        StudyNavigationPermissionsResponse response = studyService.getStudyNavigationPermissions(
                tenantId,
                studyId.toString(),
                userId,
                false
        );

        assertNotNull(response);
        assertEquals("STUDY_READ_ONLY", response.getStudyPermission());
        List<String> perms = response.getPermissions();
        assertTrue(perms.contains("STUDY_DASHBOARD_READ"));
        assertTrue(perms.contains("CALENDAR_READ"));
        assertTrue(perms.contains("POTENTIAL_PARTICIPANT_READ"));
        assertTrue(perms.contains("ENROLLED_PARTICIPANT_READ"));
        assertFalse(perms.contains("TASK_READ"));
        assertFalse(perms.contains("RECRUITMENT_READ"));
        assertFalse(perms.contains("STUDY_SETTINGS_MANAGE"));
    }

    @Test
    void getStudyNavigationPermissions_5_noStudyMembership_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Private Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of());
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of());

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyService.getStudyNavigationPermissions(tenantId, studyId.toString(), userId, false)
        );
    }

    @Test
    void getStudyNavigationPermissions_6_expiredAssignment_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Expired Assignment Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UserRoleAssignment expiredAssignment = new UserRoleAssignment();
        expiredAssignment.setUserId(userId);
        expiredAssignment.setStudyId(studyId);
        expiredAssignment.setActive(true);
        expiredAssignment.setEffectiveFrom(java.time.OffsetDateTime.now().minusDays(60));
        expiredAssignment.setEffectiveTo(java.time.OffsetDateTime.now().minusDays(5)); // expired 5 days ago

        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of(expiredAssignment));

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyService.getStudyNavigationPermissions(tenantId, studyId.toString(), userId, false)
        );
    }

    @Test
    void getStudyNavigationPermissions_7_inactiveAssignment_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Inactive Assignment Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of());

        com.enrollnow.study.models.StudyMember inactiveMember = new com.enrollnow.study.models.StudyMember();
        inactiveMember.setActive(false); // deactivated
        when(studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, userId))
                .thenReturn(Optional.of(inactiveMember));

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyService.getStudyNavigationPermissions(tenantId, studyId.toString(), userId, false)
        );
    }

    @Test
    void getStudyNavigationPermissions_8_unresolvedCallerIdentity_throwsAccessDeniedException() {
        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyService.getStudyNavigationPermissions(tenantId, studyId.toString(), null, false)
        );
    }

    @Test
    void getStudyNavigationPermissions_9_unauthorizedStudyId_throwsAccessDeniedException() {
        UUID privateStudyId = UUID.randomUUID();
        Study study = new Study();
        study.setId(privateStudyId);
        study.setName("Unauthorized Study");

        when(studyRepository.findByTenantIdAndId(tenantId, privateStudyId)).thenReturn(Optional.of(study));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, privateStudyId))
                .thenReturn(List.of());
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of());

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyService.getStudyNavigationPermissions(tenantId, privateStudyId.toString(), userId, false)
        );
    }

    @Test
    void getStudyNavigationPermissions_10_globalSiteAdminWithoutStudyAssignment_returnsReadOnlyAndNoSettings() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("SITE-001");
        study.setName("Unassigned Study for Site Admin");
        study.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of());

        // Calling with canManageSiteAdmins = true, but user has NO explicit study assignment
        StudyNavigationPermissionsResponse response = studyService.getStudyNavigationPermissions(
                tenantId,
                studyId.toString(),
                userId,
                true
        );

        assertNotNull(response);
        // Verified: does NOT automatically elevate to STUDY_ADMIN! Receives STUDY_READ_ONLY oversight
        assertEquals("STUDY_READ_ONLY", response.getStudyPermission());
        assertEquals("Site Administrator (Read Only)", response.getStudyRole());

        List<String> perms = response.getPermissions();
        assertTrue(perms.contains("STUDY_DASHBOARD_READ"));
        assertTrue(perms.contains("CALENDAR_READ"));
        assertTrue(perms.contains("POTENTIAL_PARTICIPANT_READ"));
        assertTrue(perms.contains("ENROLLED_PARTICIPANT_READ"));
        assertFalse(perms.contains("STUDY_SETTINGS_MANAGE")); // MUST NOT have study settings
        assertFalse(perms.contains("TASK_READ"));
        assertFalse(perms.contains("RECRUITMENT_READ"));
    }

    @Test
    void getStudyNavigationPermissions_11_globalSiteAdminWithValidStudyAssignment_returnsAssignedStudyRole() {
        Study study = new Study();
        study.setId(studyId);
        study.setStudyCode("SITE-RA-01");
        study.setName("Assigned RA Study for Site Admin");
        study.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UUID roleId = UUID.randomUUID();
        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setUserId(userId);
        assignment.setStudyId(studyId);
        assignment.setRoleId(roleId);
        assignment.setActive(true);
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of(assignment));

        Role raRole = new Role();
        raRole.setId(roleId);
        raRole.setCode("STUDY_RA");
        raRole.setName("Research Assistant");
        raRole.setScopeType("STUDY");
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(raRole));

        // Calling with canManageSiteAdmins = true, but user has explicit STUDY_RA assignment
        StudyNavigationPermissionsResponse response = studyService.getStudyNavigationPermissions(
                tenantId,
                studyId.toString(),
                userId,
                true
        );

        assertNotNull(response);
        // Verified: retains assigned STUDY_RA role and is NOT elevated to STUDY_ADMIN
        assertEquals("STUDY_RA", response.getStudyPermission());
        assertEquals("Research Assistant", response.getStudyRole());

        List<String> perms = response.getPermissions();
        assertTrue(perms.contains("STUDY_DASHBOARD_READ"));
        assertTrue(perms.contains("TASK_READ"));
        assertTrue(perms.contains("RECRUITMENT_READ"));
        assertTrue(perms.contains("CALENDAR_READ"));
        assertFalse(perms.contains("POTENTIAL_PARTICIPANT_READ"));
        assertFalse(perms.contains("ENROLLED_PARTICIPANT_READ"));
        assertFalse(perms.contains("STUDY_SETTINGS_MANAGE"));
    }

    @Test
    void getStudyNavigationPermissions_12_permissionResolutionFailure_failsClosedWithEmptyPermissions() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Unknown Role Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UUID roleId = UUID.randomUUID();
        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setUserId(userId);
        assignment.setStudyId(studyId);
        assignment.setRoleId(roleId);
        assignment.setActive(true);
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of(assignment));

        Role unknownRole = new Role();
        unknownRole.setId(roleId);
        unknownRole.setCode("CUSTOM_UNRECOGNIZED_ROLE");
        unknownRole.setName("Custom Unknown");
        unknownRole.setScopeType("STUDY");
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(unknownRole));

        StudyNavigationPermissionsResponse response = studyService.getStudyNavigationPermissions(
                tenantId,
                studyId.toString(),
                userId,
                false
        );

        assertNotNull(response);
        // Verified fail closed: unknown role yields empty permissions, never admin privileges
        assertTrue(response.getPermissions().isEmpty());
    }

    @Test
    void getStudyNavigationPermissions_studyNotFound_throwsStudyNotFoundException() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        assertThrows(
                StudyNotFoundException.class,
                () -> studyService.getStudyNavigationPermissions(tenantId, studyId.toString(), userId, false)
        );
    }

    @Test
    void getStudyDetails_returnsDetailsAndGrants_forAdmin() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setStudyCode("STUDY-001");
        study.setName("ShortName");
        study.setLongName("Long Formal Study Name");
        study.setDescription("Study Description text");
        study.setIrbId("IRB-999");
        study.setRecruitmentStartDate(LocalDate.of(2026, 1, 1));
        study.setRecruitmentEndDate(LocalDate.of(2026, 12, 31));
        study.setCompletionDate(LocalDate.of(2027, 6, 30));
        study.setAllowParticipationInOtherStudies(true);
        study.setStudyUrl("https://example.com");
        study.setStudyUrlLabel("Visit Portal");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        StudyGrant grant1 = new StudyGrant();
        grant1.setId(UUID.randomUUID());
        grant1.setTenantId(tenantId);
        grant1.setStudyId(studyId);
        grant1.setGrantNumber("GRANT-101");
        grant1.setAgency("NIH");

        when(studyGrantRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(List.of(grant1));

        StudyDetailsResponse details = studyService.getStudyDetails(tenantId, studyId.toString(), userId, true);

        assertNotNull(details);
        assertEquals(studyId, details.getId());
        assertEquals("ShortName", details.getName());
        assertEquals("Long Formal Study Name", details.getLongName());
        assertEquals("IRB-999", details.getIrbId());
        assertTrue(details.isCanManage());
        assertEquals(1, details.getGrants().size());
        assertEquals("GRANT-101", details.getGrants().get(0).getGrantNumber());
        assertEquals("NIH", details.getGrants().get(0).getAgency());
    }

    @Test
    void getStudyDetails_notFound_throwsStudyNotFoundException() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        assertThrows(
                StudyNotFoundException.class,
                () -> studyService.getStudyDetails(tenantId, studyId.toString(), userId, true)
        );
    }

    @Test
    void updateStudyDetails_validRequest_persistsAndReplacesGrants() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setTenantId(tenantId);
        existing.setName("OldName");
        existing.setStudyCode("S-1");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRepository.save(any(Study.class))).thenAnswer(inv -> inv.getArgument(0));

        StudyGrant oldGrant = new StudyGrant();
        oldGrant.setId(UUID.randomUUID());
        oldGrant.setGrantNumber("OLD-G");
        when(studyGrantRepository.findByTenantIdAndStudyId(tenantId, studyId))
                .thenReturn(List.of(oldGrant))
                .thenReturn(List.of(new StudyGrant()));

        UpdateStudyDetailsRequest request = new UpdateStudyDetailsRequest(
                "NewName",
                "New Long Name",
                "New Description",
                "IRB-888",
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31),
                LocalDate.of(2027, 1, 1),
                false,
                "New Label",
                "https://newurl.org",
                List.of(new StudyGrantDto(null, "NEW-GRANT-1", "AHA"))
        );

        StudyDetailsResponse response = studyService.updateStudyDetails(tenantId, studyId.toString(), request, userId, true);

        assertNotNull(response);
        assertEquals("NewName", existing.getName());
        assertEquals("New Long Name", existing.getLongName());
        assertEquals("IRB-888", existing.getIrbId());
        assertFalse(existing.isAllowParticipationInOtherStudies());

        verify(studyGrantRepository).deleteAll(anyCollection());
        verify(studyGrantRepository).saveAll(anyCollection());
    }

    @Test
    void updateStudyDetails_endDateBeforeStartDate_throwsInvalidStudyException() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setTenantId(tenantId);
        existing.setName("ValidName");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));

        UpdateStudyDetailsRequest request = new UpdateStudyDetailsRequest(
                "ValidName",
                null,
                null,
                null,
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 5, 1), // earlier than start date
                null,
                true,
                null,
                null,
                null
        );

        InvalidStudyException ex = assertThrows(
                InvalidStudyException.class,
                () -> studyService.updateStudyDetails(tenantId, studyId.toString(), request, userId, true)
        );
        assertTrue(ex.getMessage().contains("Recruitment end date cannot be earlier than start date"));
    }

    @Test
    void updateStudyDetails_invalidName_throwsInvalidStudyException() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setTenantId(tenantId);
        existing.setName("ValidName");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));

        UpdateStudyDetailsRequest tooLong = new UpdateStudyDetailsRequest(
                "ThisStudyNameIsFarTooLongForValidation",
                null,
                null,
                null,
                null,
                null,
                null,
                true,
                null,
                null,
                null
        );

        assertThrows(
                InvalidStudyException.class,
                () -> studyService.updateStudyDetails(tenantId, studyId.toString(), tooLong, userId, true)
        );
    }

    @Test
    void exportStudy_returnsExportMapWithStudyAndGrants() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setStudyCode("EXP-01");
        study.setName("ExportStudy");
        study.setLongName("Export Long Name");
        study.setIrbId("IRB-EXP");
        study.setAllowParticipationInOtherStudies(true);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        StudyGrant grant = new StudyGrant();
        grant.setGrantNumber("G-999");
        grant.setAgency("NSF");
        when(studyGrantRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(List.of(grant));

        Map<String, Object> export = studyService.exportStudy(tenantId, studyId.toString(), userId, true);

        assertNotNull(export);
        assertEquals("2.0", export.get("version"));
        assertTrue(export.containsKey("study"));
        Map<?, ?> studyMap = (Map<?, ?>) export.get("study");
        assertEquals("ExportStudy", studyMap.get("name"));
        assertEquals("IRB-EXP", studyMap.get("irbId"));

        assertTrue(export.containsKey("study_grants"));
        List<?> grants = (List<?>) export.get("study_grants");
        assertEquals(1, grants.size());
    }

    @Test
    void updateStudyDetails_withCustomIdAutogenerationEnabled_setsUppercasePrefix() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("OrigName");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(studyRepository.existsByTenantIdAndPrefixIgnoreCaseAndIdNot(tenantId, "DEMO", studyId)).thenReturn(false);

        UpdateStudyDetailsRequest req = new UpdateStudyDetailsRequest(
                "OrigName", "Long Name", "Desc", "IRB-1",
                null, null, null, true, true, "demo", "url", "http://example.com", null
        );

        StudyDetailsResponse res = studyService.updateStudyDetails(tenantId, studyId.toString(), req, userId, true);

        assertTrue(res.isCustomIdGenerationEnabled());
        assertEquals("DEMO", res.getPrefix());
        assertEquals("DEMO", study.getPrefix());
    }

    @Test
    void updateStudyDetails_withCustomIdAutogenerationDisabled_clearsPrefix() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("OrigName");
        study.setCustomIdGenerationEnabled(true);
        study.setPrefix("OLD");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UpdateStudyDetailsRequest req = new UpdateStudyDetailsRequest(
                "OrigName", "Long Name", "Desc", "IRB-1",
                null, null, null, true, false, null, "url", "http://example.com", null
        );

        StudyDetailsResponse res = studyService.updateStudyDetails(tenantId, studyId.toString(), req, userId, true);

        assertFalse(res.isCustomIdGenerationEnabled());
        assertNull(res.getPrefix());
        assertNull(study.getPrefix());
    }

    @Test
    void updateStudyDetails_withInvalidPrefixLength_throwsInvalidStudyException() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("OrigName");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UpdateStudyDetailsRequest req = new UpdateStudyDetailsRequest(
                "OrigName", "Long Name", "Desc", "IRB-1",
                null, null, null, true, true, "TOOLONG", "url", "http://example.com", null
        );

        assertThrows(
                InvalidStudyException.class,
                () -> studyService.updateStudyDetails(tenantId, studyId.toString(), req, userId, true)
        );
    }

    @Test
    void updateStudyDetails_withDuplicatePrefix_throwsDuplicateStudyNameException() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("OrigName");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(studyRepository.existsByTenantIdAndPrefixIgnoreCaseAndIdNot(tenantId, "DUP", studyId)).thenReturn(true);

        UpdateStudyDetailsRequest req = new UpdateStudyDetailsRequest(
                "OrigName", "Long Name", "Desc", "IRB-1",
                null, null, null, true, true, "DUP", "url", "http://example.com", null
        );

        assertThrows(
                DuplicateStudyNameException.class,
                () -> studyService.updateStudyDetails(tenantId, studyId.toString(), req, userId, true)
        );
    }

    @Test
    void importStudyComponents_callsStudyConfigurationService() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        Map<String, Object> components = Map.of("statuses", List.of(Map.of("name", "Screening")));
        when(studyConfigurationService.importComponentsIntoExistingStudy(tenantId, studyId, components))
                .thenReturn(Map.of("importedCount", 1));

        Map<String, Object> result = studyService.importStudyComponents(tenantId, studyId.toString(), components, userId, true);

        assertEquals(1, result.get("importedCount"));
        verify(studyConfigurationService).importComponentsIntoExistingStudy(tenantId, studyId, components);
    }

    @Test
    void updateStudyDetails_withNullCallerAndNotAdmin_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Study One");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UpdateStudyDetailsRequest req = new UpdateStudyDetailsRequest(
                "Name", "Long Name", "Desc", "IRB-1",
                null, null, null, false, false, "TEST", null, null, null
        );

        assertThrows(
                AccessDeniedException.class,
                () -> studyService.updateStudyDetails(tenantId, studyId.toString(), req, null, false)
        );
    }

    @Test
    void updateStudyDetails_withNonAdminAndNoManagePermission_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Study One");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, userId))
                .thenReturn(Optional.empty());

        UpdateStudyDetailsRequest req = new UpdateStudyDetailsRequest(
                "Name", "Long Name", "Desc", "IRB-1",
                null, null, null, false, false, "TEST", null, null, null
        );

        assertThrows(
                AccessDeniedException.class,
                () -> studyService.updateStudyDetails(tenantId, studyId.toString(), req, userId, false)
        );
    }

    @Test
    void exportStudy_withNullCallerAndNotAdmin_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Study One");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        assertThrows(
                AccessDeniedException.class,
                () -> studyService.exportStudy(tenantId, studyId.toString(), null, false)
        );
    }

    @Test
    void importStudyComponents_withNullCallerAndNotAdmin_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Study One");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        assertThrows(
                AccessDeniedException.class,
                () -> studyService.importStudyComponents(tenantId, studyId.toString(), Map.of(), null, false)
        );
    }

    @Test
    void updateStudyDetails_crossTenant_throwsStudyNotFoundException() {
        UUID crossTenantId = UUID.randomUUID();
        when(studyRepository.findByTenantIdAndId(crossTenantId, studyId)).thenReturn(Optional.empty());

        UpdateStudyDetailsRequest req = new UpdateStudyDetailsRequest(
                "Name", "Long Name", "Desc", "IRB-1",
                null, null, null, false, false, "TEST", null, null, null
        );

        assertThrows(
                StudyNotFoundException.class,
                () -> studyService.updateStudyDetails(crossTenantId, studyId.toString(), req, userId, true)
        );
    }

    @Test
    void exportStudy_withCorruptedConfiguration_throwsInvalidStudyException() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Corrupted Config Study");

        StudyRequirement req = new StudyRequirement();
        req.setTenantId(tenantId);
        req.setStudyId(studyId);
        req.setConfiguration("{corrupted-json: invalid}");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId))
                .thenReturn(Optional.of(req));

        assertThrows(
                InvalidStudyException.class,
                () -> studyService.exportStudy(tenantId, studyId.toString(), userId, true)
        );
    }

    @Test
    void exportStudy_returnsCompletePayloadWithPrefixAndGrants() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Complete Export Study");
        study.setStudyCode("CES-1");
        study.setPrefix("EXPO");
        study.setCustomIdGenerationEnabled(true);
        study.setAllowParticipationInOtherStudies(true);

        StudyGrant grant = new StudyGrant();
        grant.setGrantNumber("GRANT-123");
        grant.setAgency("NIH");

        StudyRequirement req = new StudyRequirement();
        req.setTenantId(tenantId);
        req.setStudyId(studyId);
        req.setConfiguration("{\"statuses\": [{\"name\": \"Enrolled\"}]}");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(studyGrantRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(List.of(grant));
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(req));

        Map<String, Object> exported = studyService.exportStudy(tenantId, studyId.toString(), userId, true);

        assertNotNull(exported);
        assertTrue(exported.containsKey("study"));
        Map<?, ?> studyMap = (Map<?, ?>) exported.get("study");
        assertEquals("Complete Export Study", studyMap.get("studyName"));
        assertEquals("EXPO", studyMap.get("prefix"));
        assertEquals(true, studyMap.get("customIdGenerationEnabled"));

        assertTrue(exported.containsKey("study_grants"));
        List<?> grantsList = (List<?>) exported.get("study_grants");
        assertEquals(1, grantsList.size());

        assertTrue(exported.containsKey("statuses"));
    }

    @Test
    void generateNextCustomParticipantId_whenEnabled_returnsFormattedIdAndIncrements() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setPrefix("PRE");
        study.setCustomIdGenerationEnabled(true);
        study.setNextSequentialIdentifier(42);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        String customId = studyService.generateNextCustomParticipantId(tenantId, studyId);

        assertEquals("PRE00000043", customId);
        assertEquals(43, study.getNextSequentialIdentifier());
        verify(studyRepository).save(study);
    }

    @Test
    void generateNextCustomParticipantId_whenDisabled_returnsFallbackId() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setPrefix("PRE");
        study.setCustomIdGenerationEnabled(false);
        study.setNextSequentialIdentifier(0);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        String customId = studyService.generateNextCustomParticipantId(tenantId, studyId);

        assertTrue(customId.startsWith("SP-"));
        assertEquals(0, study.getNextSequentialIdentifier());
        verify(studyRepository, never()).save(study);
    }
}
