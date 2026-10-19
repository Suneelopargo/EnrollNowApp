package com.enrollnow.access.services;

import com.enrollnow.identity.dtos.GrantStudyAccessRequest;
import com.enrollnow.identity.exceptions.InvalidRoleAssignmentException;
import com.enrollnow.identity.exceptions.RoleNotFoundException;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
                studyRepository
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
        when(userRoleAssignmentRepository.existsByTenantIdAndUserIdAndRoleIdAndStudyIdAndActiveTrue(
                tenantId, userId, role.getId(), studyId)).thenReturn(false);

        assertDoesNotThrow(() -> studyAccessService.grantStudyAccess(tenantId, studyId, userId, request));

        verify(studyMemberRepository, times(1)).save(any(StudyMember.class));
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
}
