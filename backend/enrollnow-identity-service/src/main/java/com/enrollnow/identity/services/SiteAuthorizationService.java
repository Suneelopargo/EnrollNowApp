package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SiteAuthorizationService {

    public record CallerIdentity(UUID userId, UUID tenantId) {}

    private final SitePermissionService sitePermissionService;

    public SiteAuthorizationService(SitePermissionService sitePermissionService) {
        this.sitePermissionService = sitePermissionService;
    }

    public Optional<CallerIdentity> getAuthenticatedCaller() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return Optional.empty();
        }
        if (authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated()) {
            throw new InsufficientAuthenticationException("Authentication is required to access this resource");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            UUID userId = parseUuid(jwt.getSubject());
            UUID tenantId = parseUuid(jwt.getClaimAsString("tenantId"));
            if (userId == null) {
                throw new InsufficientAuthenticationException("Invalid authenticated user subject");
            }
            return Optional.of(new CallerIdentity(userId, tenantId));
        }

        if (principal instanceof CallerIdentity callerIdentity) {
            return Optional.of(callerIdentity);
        }

        if (principal instanceof Map<?, ?> mapPrincipal) {
            UUID userId = parseUuid(String.valueOf(mapPrincipal.get("userId")));
            UUID tenantId = parseUuid(String.valueOf(mapPrincipal.get("tenantId")));
            if (userId != null) {
                return Optional.of(new CallerIdentity(userId, tenantId));
            }
        }

        UUID nameUuid = parseUuid(authentication.getName());
        UUID detailsTenantId = null;
        if (authentication.getDetails() instanceof Map<?, ?> detailsMap && detailsMap.get("tenantId") != null) {
            detailsTenantId = parseUuid(String.valueOf(detailsMap.get("tenantId")));
        }
        if (nameUuid != null) {
            return Optional.of(new CallerIdentity(nameUuid, detailsTenantId));
        }

        return Optional.empty();
    }

    public void requireTenantMatch(UUID targetTenantId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        if (caller.tenantId() != null && targetTenantId != null && !caller.tenantId().equals(targetTenantId)) {
            throw new AccessDeniedException("Access denied: cross-tenant operation is not permitted");
        }
    }

    public void requireRegistryAccess(UUID targetTenantId, UUID siteId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        UserEffectivePermissionsResponse effective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId);

        if (!effective.isCanAccessRegistry()) {
            throw new AccessDeniedException("Access denied: Registry access requires SITE_REGISTRY, SITE_MANAGER, or SITE_ADMIN role");
        }
    }

    public void requireSiteAdminAccess(UUID targetTenantId, UUID siteId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        UserEffectivePermissionsResponse effective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId);

        if (!effective.isCanAccessSiteAdmin()) {
            throw new AccessDeniedException("Access denied: Site Administration access requires SITE_MANAGER or SITE_ADMIN role");
        }
    }

    public void requireSelfOrUserViewAccess(UUID targetTenantId, UUID targetUserId, UUID siteId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        if (caller.userId().equals(targetUserId)) {
            return;
        }

        UserEffectivePermissionsResponse effective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId);

        if (!effective.isCanAccessSiteAdmin()
                && !effective.getPermissions().contains(SitePermissionService.PERM_SITE_USERS_VIEW)) {
            throw new AccessDeniedException("Access denied: viewing other users requires SITE_MANAGER or SITE_ADMIN role");
        }
    }

    public void requireUserManageAccess(UUID targetTenantId, UUID siteId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        UserEffectivePermissionsResponse effective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId);

        if (!effective.getPermissions().contains(SitePermissionService.PERM_SITE_USERS_MANAGE)
                && !effective.isCanAccessSiteAdmin()) {
            throw new AccessDeniedException("Access denied: managing users requires SITE_MANAGER or SITE_ADMIN role");
        }
    }

    public void requireRoleAssignmentAuthorization(
            UUID targetTenantId,
            UUID targetUserId,
            String requestedRoleCode,
            String requestedScopeType,
            UUID requestedScopeId
    ) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);
        UUID siteId = "SITE".equalsIgnoreCase(requestedScopeType) ? requestedScopeId : null;

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId);

        if (!callerEffective.getPermissions().contains(SitePermissionService.PERM_SITE_USERS_MANAGE)
                && !callerEffective.isCanAccessSiteAdmin()) {
            throw new AccessDeniedException("Access denied: assigning roles requires SITE_MANAGER or SITE_ADMIN role");
        }

        if ("SITE".equalsIgnoreCase(requestedScopeType)) {
            if (targetUserId != null && caller.userId().equals(targetUserId)) {
                throw new AccessDeniedException("Access denied: users cannot modify their own site permissions");
            }

            if (SitePermissionService.ROLE_SITE_ADMIN.equalsIgnoreCase(requestedRoleCode)
                    && !callerEffective.isCanManageSiteAdmins()) {
                throw new AccessDeniedException("Access denied: only a Site Admin can assign the SITE_ADMIN role");
            }

            if (targetUserId != null) {
                UserEffectivePermissionsResponse targetEffective =
                        sitePermissionService.resolveEffectivePermissions(effectiveTenantId, targetUserId, siteId);
                if (SitePermissionService.ROLE_SITE_ADMIN.equalsIgnoreCase(targetEffective.getSiteRole())
                        && !callerEffective.isCanManageSiteAdmins()) {
                    throw new AccessDeniedException("Access denied: Site Managers cannot modify a Site Admin's site role");
                }
            }
        }
    }

    public void requireSiteRoleRemovalAuthorization(
            UUID targetTenantId,
            UUID targetUserId,
            UUID siteId
    ) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        if (targetUserId != null && caller.userId().equals(targetUserId)) {
            throw new AccessDeniedException("Access denied: users cannot remove their own site permissions");
        }

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId);

        if (!callerEffective.getPermissions().contains(SitePermissionService.PERM_SITE_USERS_MANAGE)
                && !callerEffective.isCanAccessSiteAdmin()) {
            throw new AccessDeniedException("Access denied: removing site roles requires SITE_MANAGER or SITE_ADMIN role");
        }

        if (targetUserId != null) {
            UserEffectivePermissionsResponse targetEffective =
                    sitePermissionService.resolveEffectivePermissions(effectiveTenantId, targetUserId, siteId);
            if (SitePermissionService.ROLE_SITE_ADMIN.equalsIgnoreCase(targetEffective.getSiteRole())
                    && !callerEffective.isCanManageSiteAdmins()) {
                throw new AccessDeniedException("Access denied: Site Managers cannot remove a Site Admin's site role");
            }
        }
    }

    public void requireFullSiteAdmin(UUID targetTenantId, UUID siteId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId);

        if (!callerEffective.isCanManageSiteAdmins()) {
            throw new AccessDeniedException("Access denied: this operation requires the SITE_ADMIN role");
        }
    }

    public void requireSecuritySettingsManage(UUID targetTenantId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), null);

        if (!callerEffective.isCanManageSiteAdmins()
                && !callerEffective.getPermissions().contains(SitePermissionService.PERM_SITE_SECURITY_MANAGE)) {
            throw new AccessDeniedException("Access denied: managing site security policy requires SITE_ADMIN role or SITE_SECURITY_MANAGE permission");
        }
    }

    public void requireGeneralSettingsView(UUID targetTenantId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), null);

        if (!callerEffective.isCanAccessSiteAdmin()
                && !callerEffective.getPermissions().contains(SitePermissionService.PERM_SITE_SETTINGS_VIEW)) {
            throw new AccessDeniedException("Access denied: viewing site settings requires SITE_SETTINGS_VIEW permission");
        }
    }

    public void requireGeneralSettingsManage(UUID targetTenantId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return;
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), null);

        if (!callerEffective.isCanManageSiteAdmins()
                && !callerEffective.getPermissions().contains(SitePermissionService.PERM_SITE_SETTINGS_MANAGE)) {
            throw new AccessDeniedException("Access denied: updating site settings requires SITE_SETTINGS_MANAGE permission");
        }
    }

    public Optional<UserEffectivePermissionsResponse> getCallerEffectivePermissions(UUID targetTenantId, UUID siteId) {
        Optional<CallerIdentity> callerOpt = getAuthenticatedCaller();
        if (callerOpt.isEmpty()) {
            return Optional.empty();
        }
        CallerIdentity caller = callerOpt.get();
        UUID effectiveTenantId = resolveTenantId(caller, targetTenantId);
        return Optional.ofNullable(sitePermissionService.resolveEffectivePermissions(effectiveTenantId, caller.userId(), siteId));
    }

    private UUID resolveTenantId(CallerIdentity caller, UUID targetTenantId) {
        if (caller.tenantId() != null && targetTenantId != null && !caller.tenantId().equals(targetTenantId)) {
            throw new AccessDeniedException("Access denied: cross-tenant operation is not permitted");
        }
        UUID resolved = targetTenantId != null ? targetTenantId : caller.tenantId();
        if (resolved == null) {
            throw new AccessDeniedException("Access denied: tenant context is required");
        }
        return resolved;
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
