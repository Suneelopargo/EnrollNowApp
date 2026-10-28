package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.AssignRoleRequest;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

import org.mockito.ArgumentCaptor;

import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;

@ExtendWith(MockitoExtension.class)
class UserServiceAssignRoleTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserEmailRepository userEmailRepository;

    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private SitePermissionService sitePermissionService;

    @InjectMocks
    private UserService userService;
    
    @Mock
    private AuditRecorder auditRecorder;

    @Test
    @DisplayName("assignRole reuses and updates existing active site assignment to prevent unique constraint violation")
    void shouldUpdateExistingSiteAssignmentWithoutInsertingDuplicate() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID siteId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));

        Role oldRole = new Role();
        oldRole.setId(UUID.randomUUID());
        oldRole.setCode("SITE_REGISTRY");
        oldRole.setScopeType("SITE");
        oldRole.setActive(true);

        Role newRole = new Role();
        newRole.setId(UUID.randomUUID());
        newRole.setCode("SITE_ADMIN");
        newRole.setScopeType("SITE");
        newRole.setActive(true);

        when(roleRepository.findByCode("SITE_ADMIN")).thenReturn(Optional.of(newRole));
        when(roleRepository.findById(oldRole.getId()))
        .thenReturn(Optional.of(oldRole));

        Site site = new Site();
        site.setId(siteId);
        site.setTenantId(tenantId);
        when(siteRepository.findById(siteId)).thenReturn(Optional.of(site));

        UserRoleAssignment existingAssignment = new UserRoleAssignment();
        existingAssignment.setId(UUID.randomUUID());
        existingAssignment.setTenantId(tenantId);
        existingAssignment.setUserId(userId);
        existingAssignment.setSiteId(siteId);
        existingAssignment.setRoleId(oldRole.getId());
        existingAssignment.setActive(true);

        List<UserRoleAssignment> activeAssignments = new ArrayList<>(List.of(existingAssignment));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndSiteIdAndActiveTrue(tenantId, userId, siteId))
                .thenReturn(activeAssignments);

        when(userRoleAssignmentRepository.saveAndFlush(any(UserRoleAssignment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AssignRoleRequest request = new AssignRoleRequest("SITE_ADMIN", "SITE", siteId);
        UserRoleAssignment result = userService.assignRole(tenantId, userId, request);

        assertNotNull(result);
        assertEquals(existingAssignment.getId(), result.getId());
        assertEquals(newRole.getId(), result.getRoleId());
        assertTrue(result.isActive());

        // Verify saveAndFlush was called on the existing assignment and NO insert save was made
        verify(userRoleAssignmentRepository).saveAndFlush(existingAssignment);
        verify(userRoleAssignmentRepository, never()).save(argThat(ura -> ura != existingAssignment));
        
        ArgumentCaptor<AuditEventCommand> auditCaptor =
                ArgumentCaptor.forClass(AuditEventCommand.class);

        verify(auditRecorder).record(auditCaptor.capture());

        AuditEventCommand command = auditCaptor.getValue();

        assertEquals("SITE_PERMISSION_CHANGED", command.action());
        assertEquals("USER", command.entityType());
        assertEquals(userId, command.entityId());
        assertEquals(tenantId, command.tenantId());

        assertEquals(
                oldRole.getCode(),
                command.beforeData().get("sitePermission")
        );

        assertEquals(
                newRole.getCode(),
                command.afterData().get("sitePermission")
        );

        assertEquals(
                siteId,
                command.afterData().get("siteId")
        );

        assertEquals(
                "sitePermission",
                command.changes().get(0).fieldName()
        );

        assertEquals(
                oldRole.getCode(),
                command.changes().get(0).previousValue()
        );

        assertEquals(
                newRole.getCode(),
                command.changes().get(0).newValue()
        );
    }

    @Test
    @DisplayName("assignRole returns existing assignment immediately when user already has that exact role on site")
    void shouldReturnExistingWhenRoleMatches() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID siteId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));

        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setCode("SITE_ADMIN");
        role.setScopeType("SITE");
        role.setActive(true);

        when(roleRepository.findByCode("SITE_ADMIN")).thenReturn(Optional.of(role));

        Site site = new Site();
        site.setId(siteId);
        site.setTenantId(tenantId);
        when(siteRepository.findById(siteId)).thenReturn(Optional.of(site));

        UserRoleAssignment existingAssignment = new UserRoleAssignment();
        existingAssignment.setId(UUID.randomUUID());
        existingAssignment.setTenantId(tenantId);
        existingAssignment.setUserId(userId);
        existingAssignment.setSiteId(siteId);
        existingAssignment.setRoleId(role.getId());
        existingAssignment.setActive(true);

        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndSiteIdAndActiveTrue(tenantId, userId, siteId))
                .thenReturn(List.of(existingAssignment));

        AssignRoleRequest request = new AssignRoleRequest("SITE_ADMIN", "SITE", siteId);
        UserRoleAssignment result = userService.assignRole(tenantId, userId, request);

        assertSame(existingAssignment, result);
        verify(userRoleAssignmentRepository, never()).saveAndFlush(any());
        verify(userRoleAssignmentRepository, never()).save(any());
    }
    
    @Test
    void shouldAuditSitePermissionRemoval() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID siteId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);

        Role oldRole = new Role();
        oldRole.setId(UUID.randomUUID());
        oldRole.setCode("SITE_MANAGER");
        oldRole.setScopeType("SITE");
        oldRole.setActive(true);

        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setId(UUID.randomUUID());
        assignment.setTenantId(tenantId);
        assignment.setUserId(userId);
        assignment.setRoleId(oldRole.getId());
        assignment.setSiteId(siteId);
        assignment.setActive(true);

        when(userRepository.findByTenantIdAndId(tenantId, userId))
                .thenReturn(Optional.of(user));

        when(userRoleAssignmentRepository
                .findByTenantIdAndUserIdAndSiteIdAndActiveTrue(
                        tenantId,
                        userId,
                        siteId
                ))
                .thenReturn(List.of(assignment));

        when(roleRepository.findById(oldRole.getId()))
                .thenReturn(Optional.of(oldRole));

        userService.removeSiteRole(tenantId, userId, siteId);

        assertFalse(assignment.isActive());

        verify(userRoleAssignmentRepository).save(assignment);

        ArgumentCaptor<AuditEventCommand> auditCaptor =
                ArgumentCaptor.forClass(AuditEventCommand.class);

        verify(auditRecorder).record(auditCaptor.capture());

        AuditEventCommand command = auditCaptor.getValue();

        assertEquals("SITE_PERMISSION_REMOVED", command.action());
        assertEquals("USER", command.entityType());
        assertEquals(userId, command.entityId());
        assertEquals(tenantId, command.tenantId());

        assertEquals(
                "SITE_MANAGER",
                command.beforeData().get("sitePermission")
        );

        assertEquals(
                "NONE",
                command.afterData().get("sitePermission")
        );

        assertEquals(
                siteId,
                command.afterData().get("siteId")
        );

        assertEquals(
                "sitePermission",
                command.changes().get(0).fieldName()
        );

        assertEquals(
                "SITE_MANAGER",
                command.changes().get(0).previousValue()
        );

        assertEquals(
                "NONE",
                command.changes().get(0).newValue()
        );
    }
}
