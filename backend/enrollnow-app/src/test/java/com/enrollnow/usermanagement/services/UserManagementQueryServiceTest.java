package com.enrollnow.usermanagement.services;

import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.usermanagement.dtos.UserListItemResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserManagementQueryServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserEmailRepository userEmailRepository;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private StudyRepository studyRepository;

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private SiteRepository siteRepository;

    private UserManagementQueryService queryService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID siteId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final UUID siteRoleId = UUID.randomUUID();
    private final UUID studyRoleId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        queryService = new UserManagementQueryService(
                userRepository,
                userEmailRepository,
                studyMemberRepository,
                studyRepository,
                userRoleAssignmentRepository,
                roleRepository,
                siteRepository
        );
    }

    @Test
    void getUsers_emptyList_returnsEmptyWithoutSecondaryQueries() {
        when(userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(Collections.emptyList());

        List<UserListItemResponse> result = queryService.getUsers(tenantId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verifyNoInteractions(userEmailRepository, studyMemberRepository, studyRepository, userRoleAssignmentRepository);
    }

    @Test
    void getUsers_populatesUserWithBatchQueries() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setTitle("Clinical Investigator");
        user.setStatus("ACTIVE");
        user.setCreatedAt(OffsetDateTime.now());

        when(userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of(user));

        UserEmail email = new UserEmail();
        email.setId(UUID.randomUUID());
        email.setTenantId(tenantId);
        email.setUserId(userId);
        email.setEmail("jane.doe@example.com");
        email.setPrimaryEmail(true);

        when(userEmailRepository.findByTenantIdAndPrimaryEmailTrue(tenantId)).thenReturn(List.of(email));

        Role siteAdminRole = new Role();
        siteAdminRole.setId(siteRoleId);
        siteAdminRole.setCode("SITE_ADMIN");
        siteAdminRole.setName("Site Admin");
        siteAdminRole.setScopeType("SITE");
        siteAdminRole.setActive(true);

        Role studyRole = new Role();
        studyRole.setId(studyRoleId);
        studyRole.setCode("STUDY_ADMIN");
        studyRole.setName("Study Admin");
        studyRole.setScopeType("STUDY");
        studyRole.setActive(true);

        when(roleRepository.findAll()).thenReturn(List.of(siteAdminRole, studyRole));

        UserRoleAssignment siteAssignment = new UserRoleAssignment();
        siteAssignment.setId(UUID.randomUUID());
        siteAssignment.setTenantId(tenantId);
        siteAssignment.setUserId(userId);
        siteAssignment.setSiteId(siteId);
        siteAssignment.setRoleId(siteRoleId);
        siteAssignment.setActive(true);

        UserRoleAssignment studyAssignment = new UserRoleAssignment();
        studyAssignment.setId(UUID.randomUUID());
        studyAssignment.setTenantId(tenantId);
        studyAssignment.setUserId(userId);
        studyAssignment.setStudyId(studyId);
        studyAssignment.setRoleId(studyRoleId);
        studyAssignment.setActive(true);

        when(userRoleAssignmentRepository.findByTenantIdAndActiveTrue(tenantId))
                .thenReturn(List.of(siteAssignment, studyAssignment));

        StudyMember membership = new StudyMember();
        StudyMemberId memberId = new StudyMemberId(studyId, userId);
        membership.setId(memberId);
        membership.setTenantId(tenantId);
        membership.setStudyRole("Principal Investigator");
        membership.setActive(true);

        when(studyMemberRepository.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(membership));

        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Cardio Trial A");
        study.setStudyCode("CARDIO-A");

        when(studyRepository.findByTenantId(tenantId)).thenReturn(List.of(study));

        List<UserListItemResponse> result = queryService.getUsers(tenantId);

        assertNotNull(result);
        assertEquals(1, result.size());
        UserListItemResponse item = result.get(0);
        assertEquals(userId, item.getId());
        assertEquals("Jane", item.getFirstName());
        assertEquals("Doe", item.getLastName());
        assertEquals("jane.doe@example.com", item.getPrimaryEmail());
        assertEquals("SITE_ADMIN", item.getSitePermission());
        assertEquals(siteId, item.getSiteId());

        assertNotNull(item.getStudies());
        assertEquals(1, item.getStudies().size());
        assertEquals("Cardio Trial A", item.getStudies().get(0).getName());
        assertEquals("Principal Investigator", item.getStudies().get(0).getStudyRole());
        assertEquals("STUDY_ADMIN", item.getStudies().get(0).getStudyPermission());

        // Verify batch queries were called exactly once
        verify(userRepository, times(1)).findByTenantIdOrderByCreatedAtDesc(tenantId);
        verify(siteRepository, times(1)).findFirstByTenantIdAndActiveTrueOrderByNameAsc(tenantId);
        verify(siteRepository, times(1)).findFirstByTenantId(tenantId);
        verify(userEmailRepository, times(1)).findByTenantIdAndPrimaryEmailTrue(tenantId);
        verify(roleRepository, times(1)).findAll();
        verify(userRoleAssignmentRepository, times(1)).findByTenantIdAndActiveTrue(tenantId);
        verify(studyMemberRepository, times(1)).findByTenantIdAndActiveTrue(tenantId);
        verify(studyRepository, times(1)).findByTenantId(tenantId);
    }

    @Test
    void getUsers_withRequestedSiteId_skipsSiteLookupAndExecutesExactlySixQueries() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("John");
        user.setLastName("Smith");
        user.setStatus("ACTIVE");

        when(userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of(user));
        when(userEmailRepository.findByTenantIdAndPrimaryEmailTrue(tenantId)).thenReturn(Collections.emptyList());
        when(roleRepository.findAll()).thenReturn(Collections.emptyList());
        when(userRoleAssignmentRepository.findByTenantIdAndActiveTrue(tenantId)).thenReturn(Collections.emptyList());
        when(studyMemberRepository.findByTenantIdAndActiveTrue(tenantId)).thenReturn(Collections.emptyList());
        when(studyRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        List<UserListItemResponse> result = queryService.getUsers(tenantId, siteId);

        assertEquals(1, result.size());
        assertEquals(siteId, result.get(0).getSiteId());
        verifyNoInteractions(siteRepository);
        verify(userRepository, times(1)).findByTenantIdOrderByCreatedAtDesc(tenantId);
        verify(userEmailRepository, times(1)).findByTenantIdAndPrimaryEmailTrue(tenantId);
        verify(roleRepository, times(1)).findAll();
        verify(userRoleAssignmentRepository, times(1)).findByTenantIdAndActiveTrue(tenantId);
        verify(studyMemberRepository, times(1)).findByTenantIdAndActiveTrue(tenantId);
        verify(studyRepository, times(1)).findByTenantId(tenantId);
    }
}
