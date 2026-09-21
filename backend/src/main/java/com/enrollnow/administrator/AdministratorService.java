package com.enrollnow.administrator;

import com.enrollnow.administrator.dto.*;
import com.enrollnow.audit.AuditService;
import com.enrollnow.models.*;
import com.enrollnow.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdministratorService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final SiteRepository siteRepository;
    private final UserSiteAssignmentRepository userSiteAssignmentRepository;
    private final NavigationModuleRepository navigationModuleRepository;
    private final NavigationLinkRepository navigationLinkRepository;
    private final RoleLinkAccessRepository roleLinkAccessRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdministratorService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            SiteRepository siteRepository,
            UserSiteAssignmentRepository userSiteAssignmentRepository,
            NavigationModuleRepository navigationModuleRepository,
            NavigationLinkRepository navigationLinkRepository,
            RoleLinkAccessRepository roleLinkAccessRepository,
            AdminAuditLogRepository adminAuditLogRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.siteRepository = siteRepository;
        this.userSiteAssignmentRepository = userSiteAssignmentRepository;
        this.navigationModuleRepository = navigationModuleRepository;
        this.navigationLinkRepository = navigationLinkRepository;
        this.roleLinkAccessRepository = roleLinkAccessRepository;
        this.adminAuditLogRepository = adminAuditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    // =========================================================================
    // DASHBOARD
    // =========================================================================
    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboard() {
        AdminDashboardDto dto = new AdminDashboardDto();
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActive(true);
        dto.setTotalUsers(totalUsers);
        dto.setActiveUsers(activeUsers);
        dto.setInactiveUsers(totalUsers - activeUsers);
        dto.setActiveLocations(siteRepository.count());

        // Count Admin Users
        long adminCount = 0;
        List<User> allUsers = userRepository.findAll();
        for (User u : allUsers) {
            List<String> codes = u.getActiveRoleCodes();
            if (codes.contains("ROLE_SUPER_ADMIN") || codes.contains("ROLE_SITE_ADMIN") || codes.contains("SUPER_ADMIN") || codes.contains("SITE_ADMIN")) {
                adminCount++;
            }
        }
        dto.setAdminUsers(adminCount);

        // Users by Role
        List<Map<String, Object>> usersByRole = new ArrayList<>();
        List<Role> roles = roleRepository.findAll();
        for (Role r : roles) {
            long count = userRoleRepository.countByRoleIdAndStatus(r.getId(), "ACTIVE");
            Map<String, Object> map = new HashMap<>();
            map.put("role", r.getName());
            map.put("count", count);
            usersByRole.add(map);
        }
        dto.setUsersByRole(usersByRole);

        // Users by Location (Sites)
        List<Map<String, Object>> usersByLocation = new ArrayList<>();
        List<Site> sites = siteRepository.findAll();
        for (Site s : sites) {
            long count = userSiteAssignmentRepository.countBySiteIdAndStatus(s.getId(), "ACTIVE");
            Map<String, Object> map = new HashMap<>();
            map.put("locationId", s.getId());
            map.put("locationName", s.getName());
            map.put("count", count);
            usersByLocation.add(map);
        }
        dto.setUsersByLocation(usersByLocation);

        // Recent Audit Activity
        List<AdminAuditLog> logs = adminAuditLogRepository.findTop10ByOrderByCreatedAtDesc();
        dto.setRecentActivity(logs.stream().map(this::mapAuditLogToDto).collect(Collectors.toList()));

        return dto;
    }

    // =========================================================================
    // USERS
    // =========================================================================
    @Transactional(readOnly = true)
    public List<AdminUserDto> getUsers(String search, Boolean active) {
        Pageable pageable = PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> page;
        if ((search == null || search.isBlank()) && active == null) {
            page = userRepository.findAll(pageable);
        } else {
            page = userRepository.searchUsers(
                    (search != null && !search.isBlank()) ? search.trim() : null,
                    active,
                    pageable
            );
        }
        return page.getContent().stream().map(this::mapUserToAdminDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return mapUserToAdminDto(user);
    }

    @Transactional
    public AdminUserDto createUser(CreateUserRequest request, Long performerId, String performerUsername, String ipAddress) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already in use: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setActive(request.getActive() != null ? request.getActive() : true);

        User savedUser = userRepository.save(user);

        // Assign Roles
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            for (String roleNameOrCode : request.getRoles()) {
                Optional<Role> roleOpt = roleRepository.findByRoleCode(roleNameOrCode)
                        .or(() -> roleRepository.findByName(roleNameOrCode));
                if (roleOpt.isPresent()) {
                    UserRole ur = new UserRole(savedUser, roleOpt.get());
                    userRoleRepository.save(ur);
                }
            }
        }

        // Assign Sites (Locations)
        if (request.getLocationIds() != null && !request.getLocationIds().isEmpty()) {
            for (Long siteId : request.getLocationIds()) {
                siteRepository.findById(siteId).ifPresent(site -> {
                    UserSiteAssignment usa = new UserSiteAssignment(savedUser, site);
                    userSiteAssignmentRepository.save(usa);
                });
            }
        }

        auditService.logAdminAction("USER_CREATED", performerUsername, performerId, savedUser.getId(), savedUser.getUsername(),
                "Created user account " + savedUser.getUsername(), ipAddress);

        return mapUserToAdminDto(savedUser);
    }

    @Transactional
    public AdminUserDto updateUser(Long id, UpdateUserRequest request, Long performerId, String performerUsername, String ipAddress) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use by another user: " + request.getEmail());
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        // Update roles if provided
        if (request.getRoles() != null) {
            userRoleRepository.deleteByUserId(user.getId());
            for (String roleNameOrCode : request.getRoles()) {
                roleRepository.findByRoleCode(roleNameOrCode)
                        .or(() -> roleRepository.findByName(roleNameOrCode))
                        .ifPresent(role -> userRoleRepository.save(new UserRole(user, role)));
            }
        }

        // Update sites if provided
        if (request.getLocationIds() != null) {
            userSiteAssignmentRepository.deleteByUserId(user.getId());
            for (Long siteId : request.getLocationIds()) {
                siteRepository.findById(siteId).ifPresent(site -> {
                    userSiteAssignmentRepository.save(new UserSiteAssignment(user, site));
                });
            }
        }

        User updatedUser = userRepository.save(user);

        auditService.logAdminAction("USER_UPDATED", performerUsername, performerId, updatedUser.getId(), updatedUser.getUsername(),
                "Updated user account profile and access scopes", ipAddress);

        return mapUserToAdminDto(updatedUser);
    }

    @Transactional
    public void activateUser(Long id, Long performerId, String performerUsername, String ipAddress) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setActive(true);
        userRepository.save(user);
        auditService.logAdminAction("USER_ACTIVATED", performerUsername, performerId, user.getId(), user.getUsername(),
                "Activated user account", ipAddress);
    }

    @Transactional
    public void deactivateUser(Long id, Long performerId, String performerUsername, String ipAddress) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setActive(false);
        userRepository.save(user);
        auditService.logAdminAction("USER_DEACTIVATED", performerUsername, performerId, user.getId(), user.getUsername(),
                "Deactivated user account", ipAddress);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword, Long performerId, String performerUsername, String ipAddress) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.logAdminAction("PASSWORD_RESET", performerUsername, performerId, user.getId(), user.getUsername(),
                "Administrative password reset performed", ipAddress);
    }

    // =========================================================================
    // ROLES & RBAC
    // =========================================================================
    @Transactional(readOnly = true)
    public List<AdminRoleDto> getRoles() {
        return roleRepository.findAll().stream().map(this::mapRoleToAdminDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminRoleDto getRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));
        return mapRoleToAdminDto(role);
    }

    @Transactional
    public AdminRoleDto createRole(CreateRoleRequest request, Long performerId, String performerUsername, String ipAddress) {
        if (roleRepository.existsByRoleCode(request.getRoleCode())) {
            throw new IllegalArgumentException("Role code already exists: " + request.getRoleCode());
        }
        if (roleRepository.existsByName(request.getRoleName())) {
            throw new IllegalArgumentException("Role name already exists: " + request.getRoleName());
        }

        Role role = new Role();
        role.setName(request.getRoleName());
        role.setRoleCode(request.getRoleCode().startsWith("ROLE_") ? request.getRoleCode() : "ROLE_" + request.getRoleCode());
        role.setDescription(request.getDescription());
        role.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");

        Role saved = roleRepository.save(role);

        // Initialize permissions if provided
        if (request.getPermissions() != null) {
            saveRolePermissions(saved.getId(), request.getPermissions(), performerId, performerUsername, ipAddress);
        }

        auditService.logAdminAction("ROLE_CREATED", performerUsername, performerId, null, null,
                "Created role " + saved.getRoleCode(), ipAddress);

        return mapRoleToAdminDto(saved);
    }

    @Transactional
    public AdminRoleDto updateRole(Long id, UpdateRoleRequest request, Long performerId, String performerUsername, String ipAddress) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));

        role.setName(request.getRoleName());
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            role.setStatus(request.getStatus());
        }

        Role saved = roleRepository.save(role);

        if (request.getPermissions() != null) {
            saveRolePermissions(saved.getId(), request.getPermissions(), performerId, performerUsername, ipAddress);
        }

        auditService.logAdminAction("ROLE_UPDATED", performerUsername, performerId, null, null,
                "Updated role " + saved.getRoleCode(), ipAddress);

        return mapRoleToAdminDto(saved);
    }

    @Transactional
    public AdminRoleDto setRoleStatus(Long id, String status, Long performerId, String performerUsername, String ipAddress) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));
        role.setStatus(status);
        Role saved = roleRepository.save(role);
        auditService.logAdminAction("ROLE_STATUS_CHANGED", performerUsername, performerId, null, null,
                "Changed status of role " + role.getRoleCode() + " to " + status, ipAddress);
        return mapRoleToAdminDto(saved);
    }

    // =========================================================================
    // PERMISSION MATRIX
    // =========================================================================
    @Transactional(readOnly = true)
    public List<PermissionModuleDto> getRolePermissions(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));

        Map<Integer, RoleLinkAccess> accessMap = role.getLinkAccess().stream()
                .collect(Collectors.toMap(rla -> rla.getLink().getId(), rla -> rla, (a, b) -> a));

        List<NavigationModule> modules = navigationModuleRepository.findByActiveOrderByDisplayOrderAsc(true);
        List<PermissionModuleDto> result = new ArrayList<>();

        for (NavigationModule m : modules) {
            PermissionModuleDto mDto = new PermissionModuleDto();
            mDto.setModuleId(m.getId());
            mDto.setModuleCode(m.getModuleCode());
            mDto.setTitle(m.getTitle());
            mDto.setShortTitle(m.getShortTitle());
            mDto.setIcon(m.getIcon());
            mDto.setDisplayOrder(m.getDisplayOrder());

            List<PermissionLinkDto> linkDtos = new ArrayList<>();
            for (NavigationLink l : m.getLinks()) {
                if (l.isActive()) {
                    PermissionLinkDto lDto = new PermissionLinkDto();
                    lDto.setLinkId(l.getId());
                    lDto.setLinkCode(l.getLinkCode());
                    lDto.setTitle(l.getTitle());
                    lDto.setPath(l.getPath());
                    lDto.setIcon(l.getIcon());
                    lDto.setDescription(l.getDescription());
                    lDto.setDisplayOrder(l.getDisplayOrder());

                    RoleLinkAccess rla = accessMap.get(l.getId());
                    if (rla != null) {
                        lDto.setCanView(rla.isCanView());
                        lDto.setCanCreate(rla.isCanCreate());
                        lDto.setCanEdit(rla.isCanEdit());
                        lDto.setCanDelete(rla.isCanDelete());
                        lDto.setCanExport(rla.isCanExport());
                    } else {
                        lDto.setCanView(false);
                        lDto.setCanCreate(false);
                        lDto.setCanEdit(false);
                        lDto.setCanDelete(false);
                        lDto.setCanExport(false);
                    }
                    linkDtos.add(lDto);
                }
            }
            mDto.setLinks(linkDtos);
            result.add(mDto);
        }

        return result;
    }

    @Transactional
    public List<PermissionModuleDto> saveRolePermissions(
            Long roleId, List<RolePermissionRequest> permissions, Long performerId, String performerUsername, String ipAddress) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));

        for (RolePermissionRequest req : permissions) {
            Optional<NavigationLink> linkOpt = req.getLinkId() != null
                    ? navigationLinkRepository.findById(req.getLinkId())
                    : navigationLinkRepository.findByLinkCode(req.getLinkCode());

            if (linkOpt.isPresent()) {
                NavigationLink link = linkOpt.get();
                RoleLinkAccess rla = roleLinkAccessRepository.findByRoleIdAndLinkId(role.getId(), link.getId())
                        .orElseGet(() -> new RoleLinkAccess(role, link));

                rla.setCanView(req.isCanView());
                rla.setCanCreate(req.isCanCreate());
                rla.setCanEdit(req.isCanEdit());
                rla.setCanDelete(req.isCanDelete());
                rla.setCanExport(req.isCanExport());
                rla.setStatus("ACTIVE");
                roleLinkAccessRepository.save(rla);
            }
        }

        auditService.logAdminAction("PERMISSIONS_UPDATED", performerUsername, performerId, null, null,
                "Updated permission matrix for role " + role.getRoleCode(), ipAddress);

        return getRolePermissions(roleId);
    }

    // =========================================================================
    // MULTI-ROLE USER ASSIGNMENTS
    // =========================================================================
    @Transactional(readOnly = true)
    public List<UserRoleAssignmentDto> getUserRoleAssignments(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        return user.getUserRoles().stream().map(this::mapUserRoleToDto).collect(Collectors.toList());
    }

    @Transactional
    public AdminUserDto saveUserRoleAssignments(
            Long userId, List<UserRoleAssignmentDto> assignments, Long performerId, String performerUsername, String ipAddress) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        userRoleRepository.deleteByUserId(user.getId());

        for (UserRoleAssignmentDto dto : assignments) {
            Role role = roleRepository.findById(dto.getRoleId())
                    .or(() -> roleRepository.findByRoleCode(dto.getRoleCode()))
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + dto.getRoleName()));

            UserRole ur = new UserRole(user, role);
            ur.setValidFrom(dto.getValidFrom() != null ? dto.getValidFrom() : OffsetDateTime.now());
            ur.setValidUntil(dto.getValidUntil());
            ur.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
            userRoleRepository.save(ur);
        }

        auditService.logAdminAction("ROLE_ASSIGNMENTS_UPDATED", performerUsername, performerId, user.getId(), user.getUsername(),
                "Updated multi-role assignments for " + user.getUsername(), ipAddress);

        return mapUserToAdminDto(user);
    }

    // =========================================================================
    // LOCATION / SITE ACCESS
    // =========================================================================
    @Transactional(readOnly = true)
    public List<AdminSiteOptionDto> getLocations() {
        return siteRepository.findByStatus("ACTIVE").stream()
                .map(s -> new AdminSiteOptionDto(s.getId(), s.getName(), s.getSiteCode(), s.getCity(), s.getState()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminSiteAccessDto> getUserLocations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        return user.getSiteAssignments().stream().map(this::mapSiteAssignmentToDto).collect(Collectors.toList());
    }

    @Transactional
    public List<AdminSiteAccessDto> saveUserLocations(
            Long userId, List<Long> locationIds, Long performerId, String performerUsername, String ipAddress) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        userSiteAssignmentRepository.deleteByUserId(user.getId());

        for (Long siteId : locationIds) {
            siteRepository.findById(siteId).ifPresent(site -> {
                UserSiteAssignment usa = new UserSiteAssignment(user, site);
                userSiteAssignmentRepository.save(usa);
            });
        }

        auditService.logAdminAction("SITE_ACCESS_UPDATED", performerUsername, performerId, user.getId(), user.getUsername(),
                "Updated site access scope for " + user.getUsername(), ipAddress);

        return getUserLocations(userId);
    }

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================
    @Transactional(readOnly = true)
    public AdminAuditPageDto getAuditLogs(String action, String performedBy, Long targetUserId, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminAuditLog> result;
        if ((action == null || action.isBlank()) && (performedBy == null || performedBy.isBlank()) && targetUserId == null && (search == null || search.isBlank())) {
            result = adminAuditLogRepository.findAll(pageable);
        } else {
            result = adminAuditLogRepository.searchAuditLogs(
                    (action != null && !action.isBlank()) ? action.trim() : null,
                    (performedBy != null && !performedBy.isBlank()) ? performedBy.trim() : null,
                    targetUserId,
                    (search != null && !search.isBlank()) ? search.trim() : null,
                    pageable
            );
        }

        List<AdminAuditLogDto> dtos = result.getContent().stream().map(this::mapAuditLogToDto).collect(Collectors.toList());
        return new AdminAuditPageDto(dtos, result.getTotalElements(), result.getTotalPages());
    }

    // =========================================================================
    // DTO MAPPERS
    // =========================================================================
    private AdminUserDto mapUserToAdminDto(User user) {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setFullName(user.getFullName());
        dto.setActive(user.isActive());
        dto.setRoles(user.getActiveRoleCodes());
        dto.setCreatedDate(user.getCreatedAt());
        dto.setUpdatedDate(user.getUpdatedAt());

        dto.setRoleAssignments(user.getUserRoles().stream().map(this::mapUserRoleToDto).collect(Collectors.toList()));
        dto.setAssignedLocations(user.getSiteAssignments().stream().map(this::mapSiteAssignmentToDto).collect(Collectors.toList()));

        return dto;
    }

    private UserRoleAssignmentDto mapUserRoleToDto(UserRole ur) {
        UserRoleAssignmentDto dto = new UserRoleAssignmentDto();
        dto.setRoleId(ur.getRole().getId());
        dto.setRoleName(ur.getRole().getName());
        dto.setRoleCode(ur.getRole().getRoleCode());
        dto.setDescription(ur.getRole().getDescription());
        dto.setValidFrom(ur.getValidFrom());
        dto.setValidUntil(ur.getValidUntil());
        dto.setStatus(ur.getStatus());
        dto.setCurrentlyValid(ur.isCurrentlyValid());
        return dto;
    }

    private AdminSiteAccessDto mapSiteAssignmentToDto(UserSiteAssignment usa) {
        AdminSiteAccessDto dto = new AdminSiteAccessDto();
        dto.setAssignmentId(usa.getId());
        dto.setUserId(usa.getUser().getId());
        dto.setLocationId(usa.getSite().getId());
        dto.setLocationCode(usa.getSite().getSiteCode());
        dto.setLocationName(usa.getSite().getName());
        dto.setCity(usa.getSite().getCity());
        dto.setState(usa.getSite().getState());
        dto.setStatus(usa.getStatus());
        return dto;
    }

    private AdminRoleDto mapRoleToAdminDto(Role role) {
        AdminRoleDto dto = new AdminRoleDto();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setRoleCode(role.getRoleCode());
        dto.setDescription(role.getDescription());
        dto.setStatus(role.getStatus());
        dto.setUserCount(userRoleRepository.countByRoleIdAndStatus(role.getId(), "ACTIVE"));
        dto.setCreatedAt(role.getCreatedAt());
        dto.setUpdatedAt(role.getUpdatedAt());
        return dto;
    }

    private AdminAuditLogDto mapAuditLogToDto(AdminAuditLog log) {
        AdminAuditLogDto dto = new AdminAuditLogDto();
        dto.setId(log.getId());
        dto.setAction(log.getAction());
        dto.setPerformedBy(log.getPerformedBy() != null ? log.getPerformedBy().getId() : null);
        dto.setPerformedByUsername(log.getPerformedByUsername());
        dto.setTargetUserId(log.getTargetUser() != null ? log.getTargetUser().getId() : null);
        dto.setTargetUsername(log.getTargetUsername());
        dto.setDetails(log.getDetails());
        dto.setIpAddress(log.getIpAddress());
        dto.setLocationId(log.getLocationId());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
