package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.SiteRoleAssignmentSummary;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.models.Permission;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.RolePermission;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.PermissionRepository;
import com.enrollnow.identity.repositories.RolePermissionRepository;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SitePermissionService {

    public static final String ROLE_SITE_ADMIN = "SITE_ADMIN";
    public static final String ROLE_SITE_MANAGER = "SITE_MANAGER";
    public static final String ROLE_SITE_REGISTRY = "SITE_REGISTRY";
    public static final String ROLE_NONE = "NONE";

    public static final String LABEL_SITE_ADMIN = "Site Admin & Registry Access";
    public static final String LABEL_SITE_MANAGER = "Site Manager & Registry Access";
    public static final String LABEL_SITE_REGISTRY = "Registry Access";
    public static final String LABEL_NONE = "None";

    public static final String PERM_REGISTRY_VIEW = "REGISTRY_VIEW";
    public static final String PERM_REGISTRY_MANAGE = "REGISTRY_MANAGE";
    public static final String PERM_SITE_ADMIN_ACCESS = "SITE_ADMIN_ACCESS";
    public static final String PERM_SITE_STUDIES_VIEW = "SITE_STUDIES_VIEW";
    public static final String PERM_SITE_STUDIES_CREATE = "SITE_STUDIES_CREATE";
    public static final String PERM_SITE_ALL_STUDIES_MANAGE = "SITE_ALL_STUDIES_MANAGE";
    public static final String PERM_SITE_USERS_VIEW = "SITE_USERS_VIEW";
    public static final String PERM_SITE_USERS_MANAGE = "SITE_USERS_MANAGE";
    public static final String PERM_SITE_ADMIN_USERS_MANAGE = "SITE_ADMIN_USERS_MANAGE";
    public static final String PERM_SITE_IMPORT_EXPORT = "SITE_IMPORT_EXPORT";
    public static final String PERM_SITE_AUDIT_LOG_VIEW = "SITE_AUDIT_LOG_VIEW";
    public static final String PERM_SITE_SECURITY_MANAGE = "SITE_SECURITY_MANAGE";
    public static final String PERM_SITE_SETTINGS_VIEW = "SITE_SETTINGS_VIEW";
    public static final String PERM_SITE_SETTINGS_MANAGE = "SITE_SETTINGS_MANAGE";

    private static final List<String> SITE_REGISTRY_PERMISSIONS = List.of(
            PERM_REGISTRY_VIEW,
            PERM_REGISTRY_MANAGE
    );

    private static final List<String> SITE_MANAGER_PERMISSIONS = List.of(
            PERM_REGISTRY_VIEW,
            PERM_REGISTRY_MANAGE,
            PERM_SITE_ADMIN_ACCESS,
            PERM_SITE_STUDIES_VIEW,
            PERM_SITE_STUDIES_CREATE,
            PERM_SITE_USERS_VIEW,
            PERM_SITE_USERS_MANAGE,
            PERM_SITE_IMPORT_EXPORT,
            PERM_SITE_AUDIT_LOG_VIEW,
            PERM_SITE_SETTINGS_VIEW
    );

    private static final List<String> SITE_ADMIN_PERMISSIONS = List.of(
            PERM_REGISTRY_VIEW,
            PERM_REGISTRY_MANAGE,
            PERM_SITE_ADMIN_ACCESS,
            PERM_SITE_STUDIES_VIEW,
            PERM_SITE_STUDIES_CREATE,
            PERM_SITE_ALL_STUDIES_MANAGE,
            PERM_SITE_USERS_VIEW,
            PERM_SITE_USERS_MANAGE,
            PERM_SITE_ADMIN_USERS_MANAGE,
            PERM_SITE_IMPORT_EXPORT,
            PERM_SITE_AUDIT_LOG_VIEW,
            PERM_SITE_SECURITY_MANAGE,
            PERM_SITE_SETTINGS_VIEW,
            PERM_SITE_SETTINGS_MANAGE
    );

    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final SiteRepository siteRepository;

    public SitePermissionService(
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            RoleRepository roleRepository,
            RolePermissionRepository rolePermissionRepository,
            PermissionRepository permissionRepository,
            SiteRepository siteRepository
    ) {
        this.userRoleAssignmentRepository = userRoleAssignmentRepository;
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public UserEffectivePermissionsResponse resolveEffectivePermissions(
            UUID tenantId,
            UUID userId,
            UUID requestedSiteId
    ) {
        OffsetDateTime now = OffsetDateTime.now();

        Map<UUID, Role> activeRolesById = roleRepository.findByActiveTrue()
                .stream()
                .collect(Collectors.toMap(Role::getId, Function.identity(), (a, b) -> a));

        Map<UUID, Site> tenantSitesById = siteRepository.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .collect(Collectors.toMap(Site::getId, Function.identity(), (a, b) -> a));

        List<UserRoleAssignment> allActiveAssignments =
                userRoleAssignmentRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, userId);

        List<UserRoleAssignment> validAssignments = allActiveAssignments.stream()
                .filter(a -> isAssignmentEffective(a, now))
                .filter(a -> activeRolesById.containsKey(a.getRoleId()))
                .toList();

        // Collect site-scoped assignments (siteId != null, teamId == null, studyId == null)
        Map<UUID, Role> highestSiteRoleBySiteId = new LinkedHashMap<>();
        for (UserRoleAssignment assignment : validAssignments) {
            if (assignment.getSiteId() != null
                    && assignment.getTeamId() == null
                    && assignment.getStudyId() == null) {
                Role role = activeRolesById.get(assignment.getRoleId());
                if (role != null && "SITE".equalsIgnoreCase(role.getScopeType())) {
                    Role existing = highestSiteRoleBySiteId.get(assignment.getSiteId());
                    if (existing == null || siteRolePriority(role.getCode()) > siteRolePriority(existing.getCode())) {
                        highestSiteRoleBySiteId.put(assignment.getSiteId(), role);
                    }
                }
            }
        }

        List<SiteRoleAssignmentSummary> siteSummaries = highestSiteRoleBySiteId.entrySet()
                .stream()
                .sorted(Comparator.comparingInt(
                        (Map.Entry<UUID, Role> e) -> siteRolePriority(e.getValue().getCode())
                ).reversed())
                .map(entry -> {
                    UUID sId = entry.getKey();
                    Role r = entry.getValue();
                    Site site = tenantSitesById.get(sId);
                    return new SiteRoleAssignmentSummary(
                            sId,
                            site != null ? site.getSiteCode() : null,
                            site != null ? site.getName() : null,
                            r.getCode(),
                            r.getName(),
                            toSitePermissionLabel(r.getCode())
                    );
                })
                .toList();

        // Determine active site context
        UUID effectiveSiteId = requestedSiteId;
        if (effectiveSiteId == null) {
            if (!siteSummaries.isEmpty()) {
                effectiveSiteId = siteSummaries.get(0).getSiteId();
            } else {
                Optional<Site> defaultSite = siteRepository.findFirstByTenantIdAndActiveTrueOrderByNameAsc(tenantId);
                if (defaultSite.isEmpty()) {
                    defaultSite = siteRepository.findFirstByTenantId(tenantId);
                }
                effectiveSiteId = defaultSite.map(Site::getId).orElse(null);
            }
        }

        Site resolvedSite = effectiveSiteId != null ? tenantSitesById.get(effectiveSiteId) : null;
        if (resolvedSite == null && effectiveSiteId != null) {
            resolvedSite = siteRepository.findById(effectiveSiteId)
                    .filter(s -> tenantId.equals(s.getTenantId()))
                    .orElse(null);
        }

        Role effectiveSiteRoleObj = effectiveSiteId != null ? highestSiteRoleBySiteId.get(effectiveSiteId) : null;
        String effectiveSiteRoleCode = effectiveSiteRoleObj != null ? effectiveSiteRoleObj.getCode() : ROLE_NONE;

        // Collect effective role codes (site role for the active site + valid study roles)
        Set<String> effectiveRoleCodes = new LinkedHashSet<>();
        Set<UUID> effectiveRoleIds = new LinkedHashSet<>();

        if (effectiveSiteRoleObj != null) {
            effectiveRoleCodes.add(effectiveSiteRoleObj.getCode());
            effectiveRoleIds.add(effectiveSiteRoleObj.getId());
        }

        for (UserRoleAssignment assignment : validAssignments) {
            Role role = activeRolesById.get(assignment.getRoleId());
            if (role != null && !"SITE".equalsIgnoreCase(role.getScopeType())) {
                effectiveRoleCodes.add(role.getCode());
                effectiveRoleIds.add(role.getId());
            }
        }

        // Collect effective permissions from canonical site role mappings + database role_permissions
        Set<String> effectivePermissions = new LinkedHashSet<>(canonicalPermissionsForSiteRole(effectiveSiteRoleCode));

        for (UUID roleId : effectiveRoleIds) {
            List<RolePermission> rolePerms = rolePermissionRepository.findByIdRoleId(roleId);
            if (rolePerms != null && !rolePerms.isEmpty()) {
                List<UUID> permIds = rolePerms.stream()
                        .map(rp -> rp.getId().getPermissionId())
                        .toList();
                List<Permission> perms = permissionRepository.findAllById(permIds);
                for (Permission perm : perms) {
                    if (perm != null && perm.getCode() != null) {
                        effectivePermissions.add(perm.getCode());
                    }
                }
            }
        }

        boolean canAccessRegistry =
                ROLE_SITE_ADMIN.equals(effectiveSiteRoleCode)
                        || ROLE_SITE_MANAGER.equals(effectiveSiteRoleCode)
                        || ROLE_SITE_REGISTRY.equals(effectiveSiteRoleCode)
                        || effectivePermissions.contains(PERM_REGISTRY_VIEW);

        boolean canAccessSiteAdmin =
                ROLE_SITE_ADMIN.equals(effectiveSiteRoleCode)
                        || ROLE_SITE_MANAGER.equals(effectiveSiteRoleCode)
                        || effectivePermissions.contains(PERM_SITE_ADMIN_ACCESS);

        boolean canManageSiteAdmins =
                ROLE_SITE_ADMIN.equals(effectiveSiteRoleCode)
                        || effectivePermissions.contains(PERM_SITE_ADMIN_USERS_MANAGE);

        UserEffectivePermissionsResponse response = new UserEffectivePermissionsResponse();
        response.setUserId(userId);
        response.setTenantId(tenantId);
        response.setSiteId(effectiveSiteId);
        response.setSiteCode(resolvedSite != null ? resolvedSite.getSiteCode() : null);
        response.setSiteName(resolvedSite != null ? resolvedSite.getName() : null);
        response.setSiteRole(effectiveSiteRoleCode);
        response.setSitePermissionLabel(toSitePermissionLabel(effectiveSiteRoleCode));
        response.setRoles(new ArrayList<>(effectiveRoleCodes));
        response.setPermissions(new ArrayList<>(effectivePermissions));
        response.setSiteAssignments(siteSummaries);
        response.setCanAccessRegistry(canAccessRegistry);
        response.setCanAccessSiteAdmin(canAccessSiteAdmin);
        response.setCanManageSiteAdmins(canManageSiteAdmins);

        return response;
    }

    public static boolean isAssignmentEffective(UserRoleAssignment assignment, OffsetDateTime now) {
        if (assignment == null || !assignment.isActive()) {
            return false;
        }
        if (assignment.getEffectiveFrom() != null && assignment.getEffectiveFrom().isAfter(now)) {
            return false;
        }
        if (assignment.getEffectiveTo() != null && !assignment.getEffectiveTo().isAfter(now)) {
            return false;
        }
        return true;
    }

    public static int siteRolePriority(String roleCode) {
        if (roleCode == null) {
            return 0;
        }
        return switch (roleCode.trim().toUpperCase()) {
            case ROLE_SITE_ADMIN -> 3;
            case ROLE_SITE_MANAGER -> 2;
            case ROLE_SITE_REGISTRY -> 1;
            default -> 0;
        };
    }

    public static String toSitePermissionLabel(String roleCode) {
        if (roleCode == null) {
            return LABEL_NONE;
        }
        return switch (roleCode.trim().toUpperCase()) {
            case ROLE_SITE_ADMIN -> LABEL_SITE_ADMIN;
            case ROLE_SITE_MANAGER -> LABEL_SITE_MANAGER;
            case ROLE_SITE_REGISTRY -> LABEL_SITE_REGISTRY;
            default -> LABEL_NONE;
        };
    }

    public static List<String> canonicalPermissionsForSiteRole(String roleCode) {
        if (roleCode == null) {
            return Collections.emptyList();
        }
        return switch (roleCode.trim().toUpperCase()) {
            case ROLE_SITE_ADMIN -> SITE_ADMIN_PERMISSIONS;
            case ROLE_SITE_MANAGER -> SITE_MANAGER_PERMISSIONS;
            case ROLE_SITE_REGISTRY -> SITE_REGISTRY_PERMISSIONS;
            default -> Collections.emptyList();
        };
    }
}
