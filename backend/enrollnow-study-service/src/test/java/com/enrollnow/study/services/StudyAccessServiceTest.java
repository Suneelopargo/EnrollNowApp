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
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditOperation;
import com.enrollnow.common.audit.AuditRecorder;

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
    private AuditRecorder auditRecorder;

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
                siteAuthorizationService,
                auditRecorder
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
        
        ArgumentCaptor<AuditEventCommand> auditCaptor =
                ArgumentCaptor.forClass(AuditEventCommand.class);

        verify(auditRecorder).record(auditCaptor.capture());

        AuditEventCommand command = auditCaptor.getValue();

        assertEquals("STUDY_ACCESS_GRANTED", command.action());
        assertEquals("USER", command.entityType());
        assertEquals(userId, command.entityId());
        assertEquals(tenantId, command.tenantId());

        assertEquals(
                studyId,
                command.beforeData().get("studyId")
        );

        assertEquals(
                "NONE",
                command.beforeData().get("studyPermission")
        );

        assertEquals(
                studyId,
                command.afterData().get("studyId")
        );

        assertEquals(
                "STUDY_ADMIN",
                command.afterData().get("studyPermission")
        );

        assertEquals(1, command.changes().size());

        assertEquals(
                "studyPermission",
                command.changes().get(0).fieldName()
        );

        assertEquals(
                "NONE",
                command.changes().get(0).previousValue()
        );

        assertEquals(
                "STUDY_ADMIN",
                command.changes().get(0).newValue()
        );
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
    void grantStudyAccess_AuditsPermissionChange_WhenStudyPermissionChanges() {

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

        ArgumentCaptor<AuditEventCommand> auditCaptor =
                ArgumentCaptor.forClass(AuditEventCommand.class);

        verify(auditRecorder).record(auditCaptor.capture());

        AuditEventCommand command = auditCaptor.getValue();

        assertEquals(
                "STUDY_PERMISSION_CHANGED",
                command.action()
        );

        assertEquals("USER", command.entityType());
        assertEquals(userId, command.entityId());
        assertEquals(tenantId, command.tenantId());

        assertEquals(
                "STUDY_RA",
                command.beforeData().get("studyPermission")
        );

        assertEquals(
                "STUDY_ADMIN",
                command.afterData().get("studyPermission")
        );

        assertEquals(
                studyId,
                command.afterData().get("studyId")
        );

        assertEquals(
                "studyPermission",
                command.changes().get(0).fieldName()
        );

        assertEquals(
                "STUDY_RA",
                command.changes().get(0).previousValue()
        );

        assertEquals(
                "STUDY_ADMIN",
                command.changes().get(0).newValue()
        );
    }
    
    @Test
    void removeStudyAccess_AuditsPermissionRemoval() {

        Study study = new Study();
        User user = new User();

        Role existingRole = new Role();
        existingRole.setId(UUID.randomUUID());
        existingRole.setCode("STUDY_ADMIN");
        existingRole.setScopeType("STUDY");

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

        when(roleRepository.findById(existingRole.getId()))
                .thenReturn(Optional.of(existingRole));

        studyAccessService.removeStudyAccess(
                tenantId,
                studyId,
                userId
        );

        assertFalse(existingMember.isActive());
        assertFalse(existingAssignment.isActive());

        verify(studyMemberRepository).save(existingMember);
        verify(userRoleAssignmentRepository).save(existingAssignment);

        ArgumentCaptor<AuditEventCommand> auditCaptor =
                ArgumentCaptor.forClass(AuditEventCommand.class);

        verify(auditRecorder).record(auditCaptor.capture());

        AuditEventCommand command = auditCaptor.getValue();

        assertEquals("STUDY_ACCESS_REMOVED", command.action());
        assertEquals("USER", command.entityType());
        assertEquals(userId, command.entityId());
        assertEquals(tenantId, command.tenantId());

        assertEquals(
                studyId,
                command.beforeData().get("studyId")
        );

        assertEquals(
                "STUDY_ADMIN",
                command.beforeData().get("studyPermission")
        );

        assertEquals(
                "NONE",
                command.afterData().get("studyPermission")
        );

        assertEquals(
                "studyPermission",
                command.changes().get(0).fieldName()
        );

        assertEquals(
                "STUDY_ADMIN",
                command.changes().get(0).previousValue()
        );

        assertEquals(
                "NONE",
                command.changes().get(0).newValue()
        );
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
    
    @Test
    void removeStudyAccess_AddsChangeToAuditOperation_WhenOperationProvided() {

        Study study = new Study();
        User user = new User();

        Role existingRole = new Role();
        existingRole.setId(UUID.randomUUID());
        existingRole.setCode("STUDY_ADMIN");
        existingRole.setScopeType("STUDY");

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

        when(roleRepository.findById(existingRole.getId()))
                .thenReturn(Optional.of(existingRole));

        AuditOperation auditOperation =
                new AuditOperation(
                        tenantId,
                        "USER",
                        userId,
                        "USER_ACCESS_UPDATED",
                        "User access updated",
                        "API"
                );

        studyAccessService.removeStudyAccess(
                tenantId,
                studyId,
                userId,
                auditOperation
        );

        assertFalse(existingMember.isActive());
        assertFalse(existingAssignment.isActive());

        assertEquals(1, auditOperation.getChanges().size());

        assertEquals(
                "STUDY",
                auditOperation.getChanges().get(0).entityType()
        );

        assertEquals(
                studyId,
                auditOperation.getChanges().get(0).entityId()
        );

        assertEquals(
                "studyPermission",
                auditOperation.getChanges().get(0).fieldName()
        );

        assertEquals(
                "STUDY_ADMIN",
                auditOperation.getChanges().get(0).previousValue()
        );

        assertEquals(
                "NONE",
                auditOperation.getChanges().get(0).newValue()
        );

        verify(auditRecorder, never()).record(any());
    }
}
