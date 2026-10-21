package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.RoleResponse;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.repositories.PermissionRepository;
import com.enrollnow.identity.repositories.RolePermissionRepository;
import com.enrollnow.identity.repositories.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @InjectMocks
    private RoleService roleService;

    private Role siteAdminRole;
    private Role studyAdminRole;

    @BeforeEach
    void setUp() {
        siteAdminRole = new Role();
        siteAdminRole.setId(UUID.randomUUID());
        siteAdminRole.setCode("SITE_ADMIN");
        siteAdminRole.setName("Site Admin");
        siteAdminRole.setScopeType("SITE");
        siteAdminRole.setDescription("Full Site Admin");
        siteAdminRole.setSystemRole(true);
        siteAdminRole.setActive(true);

        studyAdminRole = new Role();
        studyAdminRole.setId(UUID.randomUUID());
        studyAdminRole.setCode("STUDY_ADMIN");
        studyAdminRole.setName("Study Admin");
        studyAdminRole.setScopeType("STUDY");
        studyAdminRole.setDescription("Full Study Admin");
        studyAdminRole.setSystemRole(true);
        studyAdminRole.setActive(true);
    }

    @Test
    void getRoles_withNullOrEmptyScope_returnsAllActiveRoles() {
        when(roleRepository.findByActiveTrue()).thenReturn(List.of(siteAdminRole, studyAdminRole));

        List<RoleResponse> results = roleService.getRoles(null);

        assertEquals(2, results.size());
        assertEquals("SITE_ADMIN", results.get(0).getCode());
        assertEquals("STUDY_ADMIN", results.get(1).getCode());
        verify(roleRepository, times(1)).findByActiveTrue();
        verify(roleRepository, never()).findByScopeTypeAndActiveTrue(anyString());
    }

    @Test
    void getRoles_withSiteScope_returnsFilteredSiteRoles() {
        when(roleRepository.findByScopeTypeAndActiveTrue("SITE")).thenReturn(List.of(siteAdminRole));

        List<RoleResponse> results = roleService.getRoles("site");

        assertEquals(1, results.size());
        assertEquals("SITE_ADMIN", results.get(0).getCode());
        assertEquals("Site Admin", results.get(0).getName());
        assertEquals("SITE", results.get(0).getScopeType());
        verify(roleRepository, times(1)).findByScopeTypeAndActiveTrue("SITE");
    }

    @Test
    void getRoles_withStudyScope_returnsFilteredStudyRoles() {
        when(roleRepository.findByScopeTypeAndActiveTrue("STUDY")).thenReturn(List.of(studyAdminRole));

        List<RoleResponse> results = roleService.getRoles("STUDY");

        assertEquals(1, results.size());
        assertEquals("STUDY_ADMIN", results.get(0).getCode());
        assertEquals("STUDY", results.get(0).getScopeType());
        verify(roleRepository, times(1)).findByScopeTypeAndActiveTrue("STUDY");
    }
}
