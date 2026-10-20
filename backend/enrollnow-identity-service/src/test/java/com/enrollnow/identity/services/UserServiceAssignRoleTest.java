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
}
