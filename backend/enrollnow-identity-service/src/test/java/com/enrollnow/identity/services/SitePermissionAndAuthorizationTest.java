package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.PermissionRepository;
import com.enrollnow.identity.repositories.RolePermissionRepository;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SitePermissionAndAuthorizationTest {

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private SiteRepository siteRepository;

    @InjectMocks
    private SitePermissionService sitePermissionService;

    private SiteAuthorizationService siteAuthorizationService;

    private UUID tenantId;
    private UUID siteA;
    private UUID siteB;
    private UUID studyId;
    private UUID userId;

    private Role siteAdminRole;
    private Role siteManagerRole;
    private Role siteRegistryRole;
    private Role studyAdminRole;
    private Site siteEntityA;
    private Site siteEntityB;

    @BeforeEach
    void setUp() {
        siteAuthorizationService = new SiteAuthorizationService(sitePermissionService);

        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        siteA = UUID.fromString("21000000-0000-0000-0000-000000000001");
        siteB = UUID.fromString("21000000-0000-0000-0000-000000000002");
        studyId = UUID.fromString("31000000-0000-0000-0000-000000000001");
        userId = UUID.randomUUID();

        siteAdminRole = createRole("53000000-0000-0000-0000-000000000003", "SITE_ADMIN", "Site Admin", "SITE");
        siteManagerRole = createRole("53000000-0000-0000-0000-000000000002", "SITE_MANAGER", "Site Manager", "SITE");
        siteRegistryRole = createRole("53000000-0000-0000-0000-000000000001", "SITE_REGISTRY", "Registry Access", "SITE");
        studyAdminRole = createRole("51000000-0000-0000-0000-000000000004", "STUDY_ADMIN", "Study Admin", "STUDY");

        siteEntityA = createSite(siteA, "DEFAULT_SITE", "Default Clinical Site");
        siteEntityB = createSite(siteB, "SITE_B", "Secondary Clinical Site");

        lenient().when(roleRepository.findByActiveTrue())
                .thenReturn(List.of(siteAdminRole, siteManagerRole, siteRegistryRole, studyAdminRole));
        lenient().when(siteRepository.findByTenantIdAndActiveTrue(tenantId))
                .thenReturn(List.of(siteEntityA, siteEntityB));
        lenient().when(rolePermissionRepository.findByIdRoleId(any()))
                .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Role createRole(String id, String code, String name, String scopeType) {
        Role role = new Role();
        role.setId(UUID.fromString(id));
        role.setCode(code);
        role.setName(name);
        role.setScopeType(scopeType);
        role.setActive(true);
        return role;
    }

    private Site createSite(UUID id, String code, String name) {
        Site site = new Site();
        site.setId(id);
        site.setTenantId(tenantId);
        site.setSiteCode(code);
        site.setName(name);
        site.setActive(true);
        return site;
    }

    private UserRoleAssignment createSiteAssignment(UUID targetUserId, UUID targetSiteId, UUID roleId) {
        UserRoleAssignment ura = new UserRoleAssignment();
        ura.setId(UUID.randomUUID());
        ura.setTenantId(tenantId);
        ura.setUserId(targetUserId);
        ura.setSiteId(targetSiteId);
        ura.setRoleId(roleId);
        ura.setActive(true);
        return ura;
    }

    private UserRoleAssignment createStudyAssignment(UUID targetUserId, UUID targetStudyId, UUID roleId) {
        UserRoleAssignment ura = new UserRoleAssignment();
        ura.setId(UUID.randomUUID());
        ura.setTenantId(tenantId);
        ura.setUserId(targetUserId);
        ura.setStudyId(targetStudyId);
        ura.setRoleId(roleId);
        ura.setActive(true);
        return ura;
    }

    private void authenticateAs(UUID callerUserId, UUID callerTenantId) {
        SiteAuthorizationService.CallerIdentity identity =
                new SiteAuthorizationService.CallerIdentity(callerUserId, callerTenantId);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                identity,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void resolveEffectivePermissions_forSiteAdmin_grantsFullSiteAdminAndRegistryAccess() {
        UserRoleAssignment ura = createSiteAssignment(userId, siteA, siteAdminRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(ura));

        UserEffectivePermissionsResponse res =
                sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteA);

        assertEquals("SITE_ADMIN", res.getSiteRole());
        assertEquals("Site Admin & Registry Access", res.getSitePermissionLabel());
        assertTrue(res.isCanAccessRegistry());
        assertTrue(res.isCanAccessSiteAdmin());
        assertTrue(res.isCanManageSiteAdmins());
        assertTrue(res.getPermissions().contains("REGISTRY_VIEW"));
        assertTrue(res.getPermissions().contains("SITE_ADMIN_ACCESS"));
        assertTrue(res.getPermissions().contains("SITE_ADMIN_USERS_MANAGE"));
        assertTrue(res.getPermissions().contains("SITE_ALL_STUDIES_MANAGE"));
        assertTrue(res.getPermissions().contains("SITE_AUDIT_LOG_VIEW"));
        assertTrue(res.getPermissions().contains("SITE_SECURITY_MANAGE"));
    }

    @Test
    void resolveEffectivePermissions_forSiteManager_grantsManagerAndRegistryWithoutFullAdminPrivileges() {
        UserRoleAssignment ura = createSiteAssignment(userId, siteA, siteManagerRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(ura));

        UserEffectivePermissionsResponse res =
                sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteA);

        assertEquals("SITE_MANAGER", res.getSiteRole());
        assertEquals("Site Manager & Registry Access", res.getSitePermissionLabel());
        assertTrue(res.isCanAccessRegistry());
        assertTrue(res.isCanAccessSiteAdmin());
        assertFalse(res.isCanManageSiteAdmins());
        assertTrue(res.getPermissions().contains("REGISTRY_VIEW"));
        assertTrue(res.getPermissions().contains("SITE_ADMIN_ACCESS"));
        assertTrue(res.getPermissions().contains("SITE_USERS_MANAGE"));
        assertFalse(res.getPermissions().contains("SITE_ADMIN_USERS_MANAGE"));
        assertFalse(res.getPermissions().contains("SITE_ALL_STUDIES_MANAGE"));
        assertFalse(res.getPermissions().contains("SITE_SECURITY_MANAGE"));
    }

    @Test
    void resolveEffectivePermissions_forSiteRegistry_grantsRegistryOnlyWithoutSiteAdmin() {
        UserRoleAssignment ura = createSiteAssignment(userId, siteA, siteRegistryRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(ura));

        UserEffectivePermissionsResponse res =
                sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteA);

        assertEquals("SITE_REGISTRY", res.getSiteRole());
        assertEquals("Registry Access", res.getSitePermissionLabel());
        assertTrue(res.isCanAccessRegistry());
        assertFalse(res.isCanAccessSiteAdmin());
        assertFalse(res.isCanManageSiteAdmins());
        assertTrue(res.getPermissions().contains("REGISTRY_VIEW"));
        assertFalse(res.getPermissions().contains("SITE_ADMIN_ACCESS"));
    }

    @Test
    void resolveEffectivePermissions_forNoneWithStudyAdmin_preservesStudyRoleWithoutGrantingSiteAccess() {
        UserRoleAssignment studyUra = createStudyAssignment(userId, studyId, studyAdminRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(studyUra));

        UserEffectivePermissionsResponse res =
                sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteA);

        assertEquals("NONE", res.getSiteRole());
        assertEquals("None", res.getSitePermissionLabel());
        assertFalse(res.isCanAccessRegistry());
        assertFalse(res.isCanAccessSiteAdmin());
        assertFalse(res.isCanManageSiteAdmins());
        assertTrue(res.getRoles().contains("STUDY_ADMIN"));
        assertFalse(res.getPermissions().contains("SITE_ADMIN_ACCESS"));
        assertFalse(res.getPermissions().contains("REGISTRY_VIEW"));
    }

    @Test
    void resolveEffectivePermissions_multiSiteUser_resolvesSiteSpecificRolePerSiteContext() {
        UserRoleAssignment siteAAssignment = createSiteAssignment(userId, siteA, siteAdminRole.getId());
        UserRoleAssignment siteBAssignment = createSiteAssignment(userId, siteB, siteRegistryRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(siteAAssignment, siteBAssignment));

        UserEffectivePermissionsResponse resSiteA =
                sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteA);
        assertEquals("SITE_ADMIN", resSiteA.getSiteRole());
        assertTrue(resSiteA.isCanAccessSiteAdmin());
        assertTrue(resSiteA.isCanAccessRegistry());

        UserEffectivePermissionsResponse resSiteB =
                sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteB);
        assertEquals("SITE_REGISTRY", resSiteB.getSiteRole());
        assertFalse(resSiteB.isCanAccessSiteAdmin());
        assertTrue(resSiteB.isCanAccessRegistry());
    }

    @Test
    void resolveEffectivePermissions_ignoresExpiredSiteAssignments() {
        UserRoleAssignment expiredUra = createSiteAssignment(userId, siteA, siteAdminRole.getId());
        expiredUra.setEffectiveTo(OffsetDateTime.now().minusDays(1));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(expiredUra));

        UserEffectivePermissionsResponse res =
                sitePermissionService.resolveEffectivePermissions(tenantId, userId, siteA);

        assertEquals("NONE", res.getSiteRole());
        assertFalse(res.isCanAccessSiteAdmin());
        assertFalse(res.isCanAccessRegistry());
    }

    @Test
    void siteAuthorizationService_enforces401And403AndRoleHierarchyRules() {
        // 1. Anonymous principal -> 401 InsufficientAuthenticationException
        AnonymousAuthenticationToken anon = new AnonymousAuthenticationToken(
                "key", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))
        );
        SecurityContextHolder.getContext().setAuthentication(anon);
        assertThrows(
                InsufficientAuthenticationException.class,
                () -> siteAuthorizationService.requireRegistryAccess(tenantId, siteA)
        );

        // 2. Cross-tenant access -> 403 AccessDeniedException
        authenticateAs(userId, tenantId);
        UUID otherTenantId = UUID.randomUUID();
        assertThrows(
                AccessDeniedException.class,
                () -> siteAuthorizationService.requireTenantMatch(otherTenantId)
        );

        // 3. SITE_REGISTRY user can access Registry, but is denied Site Admin
        UserRoleAssignment registryUra = createSiteAssignment(userId, siteA, siteRegistryRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(registryUra));

        assertDoesNotThrow(() -> siteAuthorizationService.requireRegistryAccess(tenantId, siteA));
        assertThrows(
                AccessDeniedException.class,
                () -> siteAuthorizationService.requireSiteAdminAccess(tenantId, siteA)
        );

        // 4. SITE_MANAGER can assign SITE_MANAGER or SITE_REGISTRY, but CANNOT assign SITE_ADMIN
        UUID targetUserId = UUID.randomUUID();
        UserRoleAssignment managerUra = createSiteAssignment(userId, siteA, siteManagerRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(managerUra));
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, targetUserId))
                .thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> siteAuthorizationService.requireRoleAssignmentAuthorization(
                tenantId, targetUserId, "SITE_MANAGER", "SITE", siteA
        ));
        assertDoesNotThrow(() -> siteAuthorizationService.requireRoleAssignmentAuthorization(
                tenantId, targetUserId, "SITE_REGISTRY", "SITE", siteA
        ));
        assertThrows(
                AccessDeniedException.class,
                () -> siteAuthorizationService.requireRoleAssignmentAuthorization(
                        tenantId, targetUserId, "SITE_ADMIN", "SITE", siteA
                )
        );

        // 5. SITE_MANAGER cannot modify or remove an existing SITE_ADMIN's site role
        UserRoleAssignment targetAdminUra = createSiteAssignment(targetUserId, siteA, siteAdminRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, targetUserId))
                .thenReturn(List.of(targetAdminUra));

        assertThrows(
                AccessDeniedException.class,
                () -> siteAuthorizationService.requireRoleAssignmentAuthorization(
                        tenantId, targetUserId, "SITE_REGISTRY", "SITE", siteA
                )
        );
        assertThrows(
                AccessDeniedException.class,
                () -> siteAuthorizationService.requireSiteRoleRemovalAuthorization(tenantId, targetUserId, siteA)
        );

        // 6. SITE_ADMIN can assign SITE_ADMIN and modify/remove another SITE_ADMIN
        UserRoleAssignment callerAdminUra = createSiteAssignment(userId, siteA, siteAdminRole.getId());
        when(userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId))
                .thenReturn(List.of(callerAdminUra));

        assertDoesNotThrow(() -> siteAuthorizationService.requireRoleAssignmentAuthorization(
                tenantId, targetUserId, "SITE_ADMIN", "SITE", siteA
        ));
        assertDoesNotThrow(() -> siteAuthorizationService.requireSiteRoleRemovalAuthorization(
                tenantId, targetUserId, siteA
        ));

        // 7. Users cannot modify or remove their own site permissions
        assertThrows(
                AccessDeniedException.class,
                () -> siteAuthorizationService.requireRoleAssignmentAuthorization(
                        tenantId, userId, "SITE_MANAGER", "SITE", siteA
                )
        );
        assertThrows(
                AccessDeniedException.class,
                () -> siteAuthorizationService.requireSiteRoleRemovalAuthorization(tenantId, userId, siteA)
        );
    }
}
