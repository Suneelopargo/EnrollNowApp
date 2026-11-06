package com.enrollnow.study.services;

import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.study.dtos.GrantStudyAccessRequest;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
class StudyAccessServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private StudyRepository studyRepository;
    
   
    @Mock
    private SitePermissionService sitePermissionService;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    private StudyAccessService studyAccessService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        studyAccessService = new StudyAccessService(
                userRepository,
                roleRepository,
                userRoleAssignmentRepository,
                studyMemberRepository,
                studyRepository,
                sitePermissionService,
                siteAuthorizationService
                
        );

        SiteAuthorizationService.CallerIdentity caller = new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        lenient().when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));

        UserEffectivePermissionsResponse effective = new UserEffectivePermissionsResponse();
        effective.setCanManageSiteAdmins(true);
        effective.setPermissions(List.of(SitePermissionService.PERM_SITE_ALL_STUDIES_MANAGE));
        lenient().when(sitePermissionService.resolveEffectivePermissions(any(), any(), any())).thenReturn(effective);
    }

    @Test
    void grantStudyAccess_unauthenticated_throwsInsufficientAuthenticationException() {
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.empty());

        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Study Member");
        request.setStudyPermission("STUDY_ADMIN");

        assertThrows(
                InsufficientAuthenticationException.class,
                () -> studyAccessService.grantStudyAccess(tenantId, studyId, userId, request)
        );
    }

    @Test
    void grantStudyAccess_crossTenant_throwsAccessDeniedException() {
        doThrow(new AccessDeniedException("Access denied: cross-tenant operation is not permitted"))
                .when(siteAuthorizationService).requireTenantMatch(tenantId);

        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Study Member");
        request.setStudyPermission("STUDY_ADMIN");

        assertThrows(
                AccessDeniedException.class,
                () -> studyAccessService.grantStudyAccess(tenantId, studyId, userId, request)
        );
    }

    @Test
    void grantStudyAccess_ThrowsStudyNotFoundException_WhenStudyDoesNotExist() {
        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Study Member");
        request.setStudyPermission("STUDY_ADMIN");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        StudyNotFoundException exception = assertThrows(
                StudyNotFoundException.class,
                () -> studyAccessService.grantStudyAccess(tenantId, studyId, userId, request)
        );

        assertTrue(exception.getMessage().contains(studyId.toString()));
        verify(studyMemberRepository, never()).save(any());
    }

    @Test
    void grantStudyAccess_ThrowsUserNotFoundException_WhenUserDoesNotExist() {
        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Study Member");
        request.setStudyPermission("STUDY_ADMIN");

        Study study = new Study();
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.empty());

        assertThrows(
                UserNotFoundException.class,
                () -> studyAccessService.grantStudyAccess(tenantId, studyId, userId, request)
        );

        verify(studyMemberRepository, never()).save(any());
    }

    @Test
    void grantStudyAccess_Succeeds_WhenStudyAndUserExist() {
        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Study Coordinator");
        request.setStudyPermission("STUDY_ADMIN");

        Study study = new Study();
        User user = new User();
        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setCode("STUDY_ADMIN");
        role.setScopeType("STUDY");

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("STUDY_ADMIN")).thenReturn(Optional.of(role));
        when(studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, userId))
                .thenReturn(Optional.empty());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> studyAccessService.grantStudyAccess(tenantId, studyId, userId, request));

        verify(studyMemberRepository, times(1)).save(any(StudyMember.class));
        
        ArgumentCaptor<StudyMember> memberCaptor =
                ArgumentCaptor.forClass(StudyMember.class);

        verify(studyMemberRepository)
                .save(memberCaptor.capture());

        StudyMember savedMember =
                memberCaptor.getValue();

        assertEquals(studyId, savedMember.getId().getStudyId());
        assertEquals(userId, savedMember.getId().getUserId());
        assertEquals("Study Coordinator", savedMember.getStudyRole());
        assertTrue(savedMember.isActive());

        ArgumentCaptor<UserRoleAssignment> assignmentCaptor =
                ArgumentCaptor.forClass(UserRoleAssignment.class);

        verify(userRoleAssignmentRepository)
                .save(assignmentCaptor.capture());

        UserRoleAssignment savedAssignment =
                assignmentCaptor.getValue();

        assertEquals(userId, savedAssignment.getUserId());
        assertEquals(studyId, savedAssignment.getStudyId());
        assertEquals(role.getId(), savedAssignment.getRoleId());
        assertTrue(savedAssignment.isActive());
    }

    @Test
    void removeStudyAccess_ThrowsStudyNotFoundException_WhenStudyDoesNotExist() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        assertThrows(
                StudyNotFoundException.class,
                () -> studyAccessService.removeStudyAccess(tenantId, studyId, userId)
        );

        verify(studyMemberRepository, never()).save(any());
    }
    
    @Test
    void grantStudyAccess_UpdatesExistingStudyPermission() {

        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Study Coordinator");
        request.setStudyPermission("STUDY_ADMIN");

        Study study = new Study();
        User user = new User();

        Role oldRole = new Role();
        oldRole.setId(UUID.randomUUID());
        oldRole.setCode("STUDY_RA");
        oldRole.setScopeType("STUDY");

        Role newRole = new Role();
        newRole.setId(UUID.randomUUID());
        newRole.setCode("STUDY_ADMIN");
        newRole.setScopeType("STUDY");

        UserRoleAssignment existingAssignment =
                new UserRoleAssignment();

        existingAssignment.setId(UUID.randomUUID());
        existingAssignment.setTenantId(tenantId);
        existingAssignment.setUserId(userId);
        existingAssignment.setStudyId(studyId);
        existingAssignment.setRoleId(oldRole.getId());
        existingAssignment.setActive(true);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId))
                .thenReturn(Optional.of(study));

        when(userRepository.findByTenantIdAndId(tenantId, userId))
                .thenReturn(Optional.of(user));

        when(roleRepository.findByCode("STUDY_ADMIN"))
                .thenReturn(Optional.of(newRole));

        when(roleRepository.findById(oldRole.getId()))
                .thenReturn(Optional.of(oldRole));

        when(studyMemberRepository
                .findByTenantIdAndIdStudyIdAndIdUserId(
                        tenantId,
                        studyId,
                        userId
                ))
                .thenReturn(Optional.empty());

        when(userRoleAssignmentRepository
                .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                        tenantId,
                        userId,
                        studyId
                ))
                .thenReturn(List.of(existingAssignment));

        studyAccessService.grantStudyAccess(
                tenantId,
                studyId,
                userId,
                request
        );

        verify(userRoleAssignmentRepository)
                .saveAndFlush(existingAssignment);

       

        verify(userRoleAssignmentRepository)
        .saveAndFlush(existingAssignment);

assertEquals(
        newRole.getId(),
        existingAssignment.getRoleId()
);

assertTrue(existingAssignment.isActive());
    }
    
    @Test
    void removeStudyAccess_DeactivatesMembershipAndAssignment() {

        Study study = new Study();
        User user = new User();

        Role existingRole = new Role();
        existingRole.setId(UUID.randomUUID());
        StudyMember existingMember = new StudyMember();
        existingMember.setId(new StudyMemberId(studyId, userId));
        existingMember.setTenantId(tenantId);
        existingMember.setActive(true);

        UserRoleAssignment existingAssignment =
                new UserRoleAssignment();

        existingAssignment.setId(UUID.randomUUID());
        existingAssignment.setTenantId(tenantId);
        existingAssignment.setUserId(userId);
        existingAssignment.setStudyId(studyId);
        existingAssignment.setRoleId(existingRole.getId());
        existingAssignment.setActive(true);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId))
                .thenReturn(Optional.of(study));

        when(userRepository.findByTenantIdAndId(tenantId, userId))
                .thenReturn(Optional.of(user));

        when(studyMemberRepository
                .findByTenantIdAndIdStudyIdAndIdUserId(
                        tenantId,
                        studyId,
                        userId
                ))
                .thenReturn(Optional.of(existingMember));

        when(userRoleAssignmentRepository
                .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                        tenantId,
                        userId,
                        studyId
                ))
                .thenReturn(List.of(existingAssignment));

        
        studyAccessService.removeStudyAccess(
                tenantId,
                studyId,
                userId
        );

        assertFalse(existingMember.isActive());
        assertFalse(existingAssignment.isActive());

        verify(studyMemberRepository).save(existingMember);
        verify(userRoleAssignmentRepository).save(existingAssignment);

        
    }

    @Test
    void grantStudyAccess_nonSiteAdminModifyingSelf_throwsAccessDeniedException() {
        UserEffectivePermissionsResponse nonSiteAdmin = new UserEffectivePermissionsResponse();
        nonSiteAdmin.setCanManageSiteAdmins(false);
        nonSiteAdmin.setPermissions(List.of());
        when(sitePermissionService.resolveEffectivePermissions(tenantId, userId, null)).thenReturn(nonSiteAdmin);

        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Coordinator");
        request.setStudyPermission("STUDY_ADMIN");

        assertThrows(
                AccessDeniedException.class,
                () -> studyAccessService.grantStudyAccess(tenantId, studyId, userId, request)
        );
        verify(studyMemberRepository, never()).save(any());
    }

    @Test
    void grantStudyAccess_callerWithoutTenantClaim_throwsAccessDeniedException() {
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, null)));

        GrantStudyAccessRequest request = new GrantStudyAccessRequest();
        request.setStudyRole("Coordinator");
        request.setStudyPermission("STUDY_ADMIN");

        assertThrows(
                AccessDeniedException.class,
                () -> studyAccessService.grantStudyAccess(tenantId, studyId, UUID.randomUUID(), request)
        );
        verify(studyMemberRepository, never()).save(any());
    }

    @Test
    void removeStudyAccess_unauthorizedCaller_throwsAccessDeniedException() {
        UUID otherUserId = UUID.randomUUID();
        UserEffectivePermissionsResponse nonAdmin = new UserEffectivePermissionsResponse();
        nonAdmin.setCanManageSiteAdmins(false);
        nonAdmin.setSiteRole("SITE_REGISTRY");
        nonAdmin.setPermissions(List.of("REGISTRY_VIEW"));
        when(sitePermissionService.resolveEffectivePermissions(tenantId, userId, null)).thenReturn(nonAdmin);
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId))
                .thenReturn(List.of());

        assertThrows(
                AccessDeniedException.class,
                () -> studyAccessService.removeStudyAccess(tenantId, studyId, otherUserId)
        );
        verify(studyMemberRepository, never()).save(any());
    }
    
   
}
