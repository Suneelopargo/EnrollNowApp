package com.enrollnow.admin.services;

import com.enrollnow.admin.dto.*;
import com.enrollnow.admin.models.*;
import com.enrollnow.admin.repositories.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdministratorService {

    private static final Logger log = LoggerFactory.getLogger(AdministratorService.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final NavigationModuleRepository navigationModuleRepository;
    private final NavigationLinkRepository navigationLinkRepository;
    private final RoleLinkAccessRepository roleLinkAccessRepository;
    private final PasswordEncoder passwordEncoder;

    public AdministratorService(
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            NavigationModuleRepository navigationModuleRepository,
            NavigationLinkRepository navigationLinkRepository,
            RoleLinkAccessRepository roleLinkAccessRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.navigationModuleRepository = navigationModuleRepository;
        this.navigationLinkRepository = navigationLinkRepository;
        this.roleLinkAccessRepository = roleLinkAccessRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================================
    // DASHBOARD
    // =========================================================================
    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboard() {
        Number totalUsers = (Number) entityManager.createNativeQuery("SELECT count(*) FROM users").getSingleResult();
        Number activeUsers = (Number) entityManager.createNativeQuery("SELECT count(*) FROM users WHERE is_active = true").getSingleResult();
        Number totalRoles = (Number) entityManager.createNativeQuery("SELECT count(*) FROM roles").getSingleResult();
        Number totalSites = (Number) entityManager.createNativeQuery("SELECT count(*) FROM sites").getSingleResult();
        Number recentAudit = (Number) entityManager.createNativeQuery("SELECT count(*) FROM admin_audit_logs").getSingleResult();

        return new AdminDashboardDto(
                totalUsers != null ? totalUsers.longValue() : 0,
                activeUsers != null ? activeUsers.longValue() : 0,
                totalRoles != null ? totalRoles.longValue() : 0,
                totalSites != null ? totalSites.longValue() : 0,
                recentAudit != null ? recentAudit.longValue() : 0
        );
    }

    // =========================================================================
    // USERS
    // =========================================================================
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<AdminUserDto> getUsers(String search, Boolean active) {
        StringBuilder sql = new StringBuilder("SELECT id, username, email, first_name, last_name, phone, is_active, organization_id, created_at FROM users WHERE 1=1 ");
        if (search != null && !search.isBlank()) {
            sql.append("AND (LOWER(username) LIKE LOWER(:search) OR LOWER(email) LIKE LOWER(:search) OR LOWER(first_name) LIKE LOWER(:search) OR LOWER(last_name) LIKE LOWER(:search)) ");
        }
        if (active != null) {
            sql.append("AND is_active = :active ");
        }
        sql.append("ORDER BY created_at DESC");

        var query = entityManager.createNativeQuery(sql.toString());
        if (search != null && !search.isBlank()) {
            query.setParameter("search", "%" + search.trim() + "%");
        }
        if (active != null) {
            query.setParameter("active", active);
        }

        List<Object[]> rows = query.getResultList();
        List<AdminUserDto> result = new ArrayList<>();
        for (Object[] r : rows) {
            AdminUserDto dto = new AdminUserDto();
            dto.setId(((Number) r[0]).longValue());
            dto.setUsername((String) r[1]);
            dto.setEmail((String) r[2]);
            dto.setFirstName((String) r[3]);
            dto.setLastName((String) r[4]);
            dto.setPhone((String) r[5]);
            dto.setActive((Boolean) r[6]);
            if (r[7] != null) {
                dto.setOrganizationId(((Number) r[7]).longValue());
            }
            // Load roles
            List<String> roles = userRoleRepository.findByUserId(dto.getId()).stream()
                    .map(ur -> ur.getRole().getRoleCode())
                    .collect(Collectors.toList());
            dto.setRoles(roles);
            result.add(dto);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public AdminUserDto getUser(Long id) {
        List<AdminUserDto> users = getUsers(null, null);
        return users.stream().filter(u -> u.getId().equals(id)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    @Transactional
    public AdminUserDto createUser(CreateUserRequest request, Long performerId, String performerUsername, String ip) {
        String passHash = passwordEncoder.encode(request.getPassword());
        entityManager.createNativeQuery(
                "INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, organization_id, created_at, updated_at) " +
                        "VALUES (:u, :e, :p, :fn, :ln, :ph, true, :org, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
                .setParameter("u", request.getUsername())
                .setParameter("e", request.getEmail())
                .setParameter("p", passHash)
                .setParameter("fn", request.getFirstName())
                .setParameter("ln", request.getLastName())
                .setParameter("ph", request.getPhone())
                .setParameter("org", request.getOrganizationId())
                .executeUpdate();

        Number newId = (Number) entityManager.createNativeQuery("SELECT id FROM users WHERE username = :u")
                .setParameter("u", request.getUsername())
                .getSingleResult();

        if (request.getRoleIds() != null) {
            for (Long roleId : request.getRoleIds()) {
                roleRepository.findById(roleId).ifPresent(role -> {
                    UserRole ur = new UserRole(newId.longValue(), role);
                    userRoleRepository.save(ur);
                });
            }
        }

        logAudit("USER_CREATED", performerUsername, performerId, newId.longValue(), request.getUsername(), "Created user account", ip);
        return getUser(newId.longValue());
    }

    @Transactional
    public AdminUserDto updateUser(Long id, UpdateUserRequest request, Long performerId, String performerUsername, String ip) {
        entityManager.createNativeQuery(
                "UPDATE users SET email = :e, first_name = :fn, last_name = :ln, phone = :ph, " +
                        "is_active = COALESCE(:active, is_active), organization_id = :org, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                .setParameter("e", request.getEmail())
                .setParameter("fn", request.getFirstName())
                .setParameter("ln", request.getLastName())
                .setParameter("ph", request.getPhone())
                .setParameter("active", request.getActive())
                .setParameter("org", request.getOrganizationId())
                .setParameter("id", id)
                .executeUpdate();

        logAudit("USER_UPDATED", performerUsername, performerId, id, null, "Updated user account", ip);
        return getUser(id);
    }

    @Transactional
    public void activateUser(Long id, Long performerId, String performerUsername, String ip) {
        entityManager.createNativeQuery("UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                .setParameter("id", id)
                .executeUpdate();
        logAudit("USER_ACTIVATED", performerUsername, performerId, id, null, "Activated user account", ip);
    }

    @Transactional
    public void deactivateUser(Long id, Long performerId, String performerUsername, String ip) {
        entityManager.createNativeQuery("UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                .setParameter("id", id)
                .executeUpdate();
        logAudit("USER_DEACTIVATED", performerUsername, performerId, id, null, "Deactivated user account", ip);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword, Long performerId, String performerUsername, String ip) {
        String passHash = passwordEncoder.encode(newPassword);
        entityManager.createNativeQuery("UPDATE users SET password_hash = :p, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                .setParameter("p", passHash)
                .setParameter("id", id)
                .executeUpdate();
        logAudit("PASSWORD_RESET", performerUsername, performerId, id, null, "Administrative password reset performed", ip);
    }

    // =========================================================================
    // ROLES & RBAC
    // =========================================================================
    @Transactional(readOnly = true)
    public List<AdminRoleDto> getRoles() {
        return roleRepository.findAll().stream().map(this::mapRoleToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminRoleDto getRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));
        return mapRoleToDto(role);
    }

    @Transactional
    public AdminRoleDto createRole(CreateRoleRequest request, Long performerId, String performerUsername, String ip) {
        Role role = new Role(
                request.getName(),
                request.getRoleCode().startsWith("ROLE_") ? request.getRoleCode() : "ROLE_" + request.getRoleCode(),
                request.getDescription(),
                request.getStatus() != null ? request.getStatus() : "ACTIVE"
        );
        Role saved = roleRepository.save(role);
        logAudit("ROLE_CREATED", performerUsername, performerId, null, null, "Created role " + saved.getRoleCode(), ip);
        return mapRoleToDto(saved);
    }

    @Transactional
    public AdminRoleDto updateRole(Long id, UpdateRoleRequest request, Long performerId, String performerUsername, String ip) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));

        role.setName(request.getName());
        if (request.getDescription() != null) role.setDescription(request.getDescription());
        if (request.getStatus() != null) role.setStatus(request.getStatus());

        Role saved = roleRepository.save(role);
        logAudit("ROLE_UPDATED", performerUsername, performerId, null, null, "Updated role " + saved.getRoleCode(), ip);
        return mapRoleToDto(saved);
    }

    @Transactional
    public AdminRoleDto setRoleStatus(Long id, String status, Long performerId, String performerUsername, String ip) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));
        role.setStatus(status);
        Role saved = roleRepository.save(role);
        logAudit("ROLE_STATUS_CHANGED", performerUsername, performerId, null, null, "Changed status of role to " + status, ip);
        return mapRoleToDto(saved);
    }

    // =========================================================================
    // PERMISSIONS
    // =========================================================================
    @Transactional(readOnly = true)
    public List<PermissionModuleDto> getRolePermissions(Long roleId) {
        List<RoleLinkAccess> accesses = roleLinkAccessRepository.findByRoleId(roleId);
        Map<Integer, RoleLinkAccess> accessMap = accesses.stream()
                .collect(Collectors.toMap(rla -> rla.getLink().getId(), rla -> rla, (a, b) -> a));

        List<NavigationModule> modules = navigationModuleRepository.findAllByOrderByDisplayOrderAsc();
        List<PermissionModuleDto> result = new ArrayList<>();

        for (NavigationModule m : modules) {
            PermissionModuleDto mDto = new PermissionModuleDto(m.getId(), m.getModuleCode(), m.getTitle(), m.getIcon());
            List<PermissionLinkDto> linkDtos = new ArrayList<>();

            List<NavigationLink> links = navigationLinkRepository.findByModuleIdOrderByDisplayOrderAsc(m.getId());
            for (NavigationLink l : links) {
                PermissionLinkDto lDto = new PermissionLinkDto();
                lDto.setLinkId(l.getId());
                lDto.setLinkCode(l.getLinkCode());
                lDto.setTitle(l.getTitle());
                lDto.setPath(l.getPath());
                lDto.setIcon(l.getIcon());

                RoleLinkAccess rla = accessMap.get(l.getId());
                if (rla != null) {
                    lDto.setCanView(rla.isCanView());
                    lDto.setCanCreate(rla.isCanCreate());
                    lDto.setCanEdit(rla.isCanEdit());
                    lDto.setCanDelete(rla.isCanDelete());
                    lDto.setCanExport(rla.isCanExport());
                }
                linkDtos.add(lDto);
            }
            mDto.setLinks(linkDtos);
            result.add(mDto);
        }
        return result;
    }

    @Transactional
    public List<PermissionModuleDto> saveRolePermissions(
            Long roleId, List<RolePermissionRequest> permissions, Long performerId, String performerUsername, String ip) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));

        for (RolePermissionRequest req : permissions) {
            if (req.getLinkId() != null) {
                navigationLinkRepository.findById(req.getLinkId()).ifPresent(link -> {
                    RoleLinkAccess rla = roleLinkAccessRepository.findByRoleIdAndLinkId(role.getId(), link.getId())
                            .orElseGet(() -> new RoleLinkAccess(role, link));

                    rla.setCanView(req.isCanView());
                    rla.setCanCreate(req.isCanCreate());
                    rla.setCanEdit(req.isCanEdit());
                    rla.setCanDelete(req.isCanDelete());
                    rla.setCanExport(req.isCanExport());
                    rla.setStatus("ACTIVE");
                    roleLinkAccessRepository.save(rla);
                });
            }
        }

        logAudit("PERMISSIONS_UPDATED", performerUsername, performerId, null, null, "Updated permission matrix for role " + role.getRoleCode(), ip);
        return getRolePermissions(roleId);
    }

    // =========================================================================
    // USER ROLES & SITES
    // =========================================================================
    @Transactional(readOnly = true)
    public List<UserRoleAssignmentDto> getUserRoleAssignments(Long userId) {
        List<UserRole> assignments = userRoleRepository.findByUserId(userId);
        Set<Long> assignedRoleIds = assignments.stream().map(ur -> ur.getRole().getId()).collect(Collectors.toSet());

        return roleRepository.findAll().stream().map(r -> {
            UserRoleAssignmentDto dto = new UserRoleAssignmentDto(r.getId(), r.getRoleCode(), r.getName(), assignedRoleIds.contains(r.getId()));
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminUserDto saveUserRoleAssignments(
            Long userId, List<UserRoleAssignmentDto> assignments, Long performerId, String performerUsername, String ip) {

        userRoleRepository.deleteByUserId(userId);
        for (UserRoleAssignmentDto dto : assignments) {
            if (dto.isAssigned()) {
                roleRepository.findById(dto.getRoleId()).ifPresent(role -> {
                    UserRole ur = new UserRole(userId, role);
                    userRoleRepository.save(ur);
                });
            }
        }

        logAudit("ROLE_ASSIGNMENTS_UPDATED", performerUsername, performerId, userId, null, "Updated multi-role assignments", ip);
        return getUser(userId);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<AdminSiteOptionDto> getLocations() {
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT id, name, site_code, city, state FROM sites WHERE status = 'ACTIVE' ORDER BY name ASC").getResultList();

        List<AdminSiteOptionDto> list = new ArrayList<>();
        for (Object[] r : rows) {
            list.add(new AdminSiteOptionDto(
                    ((Number) r[0]).longValue(),
                    (String) r[1],
                    (String) r[2],
                    (String) r[3],
                    (String) r[4]
            ));
        }
        return list;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<AdminSiteAccessDto> getUserLocations(Long userId) {
        List<Object> assigned = entityManager.createNativeQuery(
                "SELECT site_id FROM user_site_assignments WHERE user_id = :u AND status = 'ACTIVE'")
                .setParameter("u", userId)
                .getResultList();

        Set<Long> assignedIds = assigned.stream()
                .filter(Objects::nonNull)
                .map(r -> ((Number) r).longValue())
                .collect(Collectors.toSet());
        return getLocations().stream().map(loc -> new AdminSiteAccessDto(
                loc.getId(),
                loc.getSiteCode(),
                loc.getName(),
                assignedIds.contains(loc.getId())
        )).collect(Collectors.toList());
    }

    @Transactional
    public List<AdminSiteAccessDto> saveUserLocations(
            Long userId, List<Long> locationIds, Long performerId, String performerUsername, String ip) {

        entityManager.createNativeQuery("DELETE FROM user_site_assignments WHERE user_id = :u")
                .setParameter("u", userId)
                .executeUpdate();

        if (locationIds != null) {
            for (Long siteId : locationIds) {
                entityManager.createNativeQuery(
                        "INSERT INTO user_site_assignments (user_id, site_id, status, created_at) VALUES (:u, :s, 'ACTIVE', CURRENT_TIMESTAMP)")
                        .setParameter("u", userId)
                        .setParameter("s", siteId)
                        .executeUpdate();
            }
        }

        logAudit("SITE_ACCESS_UPDATED", performerUsername, performerId, userId, null, "Updated site access scope", ip);
        return getUserLocations(userId);
    }

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public AdminAuditPageDto getAuditLogs(String action, String performedBy, Long targetUserId, String search, int page, int size) {
        StringBuilder sql = new StringBuilder("SELECT id, action, performed_by, performed_by_username, target_user_id, target_username, details, ip_address, location_id, created_at FROM admin_audit_logs WHERE 1=1 ");
        if (action != null && !action.isBlank()) {
            sql.append("AND action = :action ");
        }
        if (performedBy != null && !performedBy.isBlank()) {
            sql.append("AND performed_by_username = :performedBy ");
        }
        if (targetUserId != null) {
            sql.append("AND target_user_id = :targetUserId ");
        }
        if (search != null && !search.isBlank()) {
            sql.append("AND (LOWER(details) LIKE LOWER(:search) OR LOWER(action) LIKE LOWER(:search)) ");
        }
        sql.append("ORDER BY created_at DESC LIMIT :limit OFFSET :offset");

        var query = entityManager.createNativeQuery(sql.toString());
        if (action != null && !action.isBlank()) query.setParameter("action", action.trim());
        if (performedBy != null && !performedBy.isBlank()) query.setParameter("performedBy", performedBy.trim());
        if (targetUserId != null) query.setParameter("targetUserId", targetUserId);
        if (search != null && !search.isBlank()) query.setParameter("search", "%" + search.trim() + "%");
        query.setParameter("limit", size);
        query.setParameter("offset", page * size);

        List<Object[]> rows = query.getResultList();
        List<AdminAuditLogDto> dtos = new ArrayList<>();
        for (Object[] r : rows) {
            AdminAuditLogDto dto = new AdminAuditLogDto();
            dto.setId(((Number) r[0]).longValue());
            dto.setAction((String) r[1]);
            if (r[2] != null) dto.setPerformedBy(((Number) r[2]).longValue());
            dto.setPerformedByUsername((String) r[3]);
            if (r[4] != null) dto.setTargetUserId(((Number) r[4]).longValue());
            dto.setTargetUsername((String) r[5]);
            dto.setDetails((String) r[6]);
            dto.setIpAddress((String) r[7]);
            if (r[8] != null) dto.setLocationId(((Number) r[8]).longValue());
            dtos.add(dto);
        }

        Number count = (Number) entityManager.createNativeQuery("SELECT count(*) FROM admin_audit_logs").getSingleResult();
        long totalElements = count != null ? count.longValue() : 0;
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new AdminAuditPageDto(dtos, page, size, totalElements, totalPages);
    }

    private void logAudit(String action, String performerUsername, Long performerId, Long targetUserId, String targetUsername, String details, String ip) {
        try {
            entityManager.createNativeQuery(
                    "INSERT INTO admin_audit_logs (action, performed_by, performed_by_username, target_user_id, target_username, details, ip_address, created_at) " +
                            "VALUES (:act, :pId, :pU, :tId, :tU, :det, :ip, CURRENT_TIMESTAMP)")
                    .setParameter("act", action)
                    .setParameter("pId", performerId)
                    .setParameter("pU", performerUsername)
                    .setParameter("tId", targetUserId)
                    .setParameter("tU", targetUsername)
                    .setParameter("det", details)
                    .setParameter("ip", ip)
                    .executeUpdate();
        } catch (Exception ex) {
            log.error("Failed to write admin audit log: {}", ex.getMessage());
        }
    }

    private AdminRoleDto mapRoleToDto(Role role) {
        AdminRoleDto dto = new AdminRoleDto();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setRoleCode(role.getRoleCode());
        dto.setDescription(role.getDescription());
        dto.setStatus(role.getStatus());
        dto.setCreatedAt(role.getCreatedAt());
        return dto;
    }
}
