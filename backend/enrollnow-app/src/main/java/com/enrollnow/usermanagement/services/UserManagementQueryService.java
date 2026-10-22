package com.enrollnow.usermanagement.services;

import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.services.SitePermissionService;

import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;

import com.enrollnow.usermanagement.dtos.UserListItemResponse;
import com.enrollnow.usermanagement.dtos.UserStudyAccessResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * High-performance query service for Administrative User Management views.
 * Resolves user summaries, site permissions, and study access while preventing N+1 database queries
 * via batch fetching and in-memory indexing.
 */
@Service
public class UserManagementQueryService {

    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final StudyRepository studyRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final RoleRepository roleRepository;
    private final SiteRepository siteRepository;

    public UserManagementQueryService(
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            StudyMemberRepository studyMemberRepository,
            StudyRepository studyRepository,
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            RoleRepository roleRepository) {
        this(
                userRepository,
                userEmailRepository,
                studyMemberRepository,
                studyRepository,
                userRoleAssignmentRepository,
                roleRepository,
                null
        );
    }

    @Autowired
    public UserManagementQueryService(
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            StudyMemberRepository studyMemberRepository,
            StudyRepository studyRepository,
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            RoleRepository roleRepository,
            SiteRepository siteRepository) {

        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.studyMemberRepository = studyMemberRepository;
        this.studyRepository = studyRepository;
        this.userRoleAssignmentRepository = userRoleAssignmentRepository;
        this.roleRepository = roleRepository;
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public List<UserListItemResponse> getUsers(UUID tenantId) {
        return getUsers(tenantId, null);
    }

    @Transactional(readOnly = true)
    public List<UserListItemResponse> getUsers(UUID tenantId, UUID requestedSiteId) {
        if (tenantId == null) {
            return Collections.emptyList();
        }

        List<User> users = userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        if (users.isEmpty()) {
            return Collections.emptyList();
        }

        OffsetDateTime now = OffsetDateTime.now();

        // 1. Resolve default tenant site id
        UUID defaultTenantSiteId = requestedSiteId;
        if (defaultTenantSiteId == null && siteRepository != null) {
            defaultTenantSiteId = siteRepository
                    .findFirstByTenantIdAndActiveTrueOrderByNameAsc(tenantId)
                    .map(Site::getId)
                    .orElseGet(() -> siteRepository.findFirstByTenantId(tenantId).map(Site::getId).orElse(null));
        }

        // 2. Batch load primary emails for tenant
        Map<UUID, String> primaryEmailsByUserId = userEmailRepository
                .findByTenantIdAndPrimaryEmailTrue(tenantId)
                .stream()
                .filter(e -> e.getUserId() != null && e.getEmail() != null)
                .collect(Collectors.toMap(
                        UserEmail::getUserId,
                        UserEmail::getEmail,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));

        // 3. Batch load all active roles for in-memory O(1) lookup
        Map<UUID, Role> rolesById = roleRepository.findAll()
                .stream()
                .filter(r -> r.getId() != null)
                .collect(Collectors.toMap(
                        Role::getId,
                        Function.identity(),
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));

        // 4. Batch load all active user role assignments for tenant
        List<UserRoleAssignment> allAssignments = userRoleAssignmentRepository.findByTenantIdAndActiveTrue(tenantId);
        Map<UUID, List<UserRoleAssignment>> assignmentsByUserId = allAssignments.stream()
                .filter(a -> a.getUserId() != null)
                .collect(Collectors.groupingBy(UserRoleAssignment::getUserId));

        // 5. Batch load all active study memberships for tenant
        List<StudyMember> allMemberships = studyMemberRepository.findByTenantIdAndActiveTrue(tenantId);
        Map<UUID, List<StudyMember>> membershipsByUserId = allMemberships.stream()
                .filter(m -> m.getId() != null && m.getId().getUserId() != null)
                .collect(Collectors.groupingBy(m -> m.getId().getUserId()));

        // 6. Batch load all studies for tenant
        Map<UUID, Study> studiesById = studyRepository.findByTenantId(tenantId)
                .stream()
                .filter(s -> s.getId() != null)
                .collect(Collectors.toMap(
                        Study::getId,
                        Function.identity(),
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));

        List<UserListItemResponse> response = new ArrayList<>(users.size());

        for (User user : users) {
            UUID userId = user.getId();

            UserListItemResponse item = new UserListItemResponse();
            item.setId(userId);
            item.setFirstName(user.getFirstName());
            item.setLastName(user.getLastName());
            item.setTitle(user.getTitle());
            item.setStatus(user.getStatus());
            item.setCreatedAt(user.getCreatedAt());

            String primaryEmail = primaryEmailsByUserId.get(userId);
            if (primaryEmail != null) {
                item.setPrimaryEmail(primaryEmail);
            }

            List<UserRoleAssignment> userAssignments = assignmentsByUserId.getOrDefault(userId, Collections.emptyList());

            // Resolve site permissions
            String sitePermission = "NONE";
            UUID resolvedUserSiteId = requestedSiteId != null ? requestedSiteId : defaultTenantSiteId;
            int highestPriority = 0;

            for (UserRoleAssignment assignment : userAssignments) {
                if (!SitePermissionService.isAssignmentEffective(assignment, now)) {
                    continue;
                }
                if (assignment.getTeamId() != null || assignment.getStudyId() != null || assignment.getSiteId() == null) {
                    continue;
                }
                if (requestedSiteId != null && !requestedSiteId.equals(assignment.getSiteId())) {
                    continue;
                }

                Role role = rolesById.get(assignment.getRoleId());
                if (role != null && role.isActive() && "SITE".equalsIgnoreCase(role.getScopeType())) {
                    int priority = SitePermissionService.siteRolePriority(role.getCode());
                    if (priority > highestPriority) {
                        highestPriority = priority;
                        sitePermission = role.getCode();
                        resolvedUserSiteId = assignment.getSiteId();
                    }
                }
            }

            item.setSiteId(resolvedUserSiteId);
            item.setSitePermission(sitePermission);

            // Resolve study roles and permissions
            Map<UUID, String> studyRoles = new LinkedHashMap<>();
            Map<UUID, String> studyPermissions = new LinkedHashMap<>();

            // A. From study_members
            List<StudyMember> memberships = membershipsByUserId.getOrDefault(userId, Collections.emptyList());
            for (StudyMember membership : memberships) {
                if (membership.getId() != null && membership.getId().getStudyId() != null) {
                    studyRoles.put(membership.getId().getStudyId(), membership.getStudyRole());
                }
            }

            // B. From user_role_assignments
            for (UserRoleAssignment assignment : userAssignments) {
                if (!SitePermissionService.isAssignmentEffective(assignment, now)) {
                    continue;
                }
                UUID sId = assignment.getStudyId();
                if (sId != null) {
                    Role role = rolesById.get(assignment.getRoleId());
                    if (role != null && role.isActive() && "STUDY".equalsIgnoreCase(role.getScopeType())) {
                        studyPermissions.putIfAbsent(sId, role.getCode());
                        studyRoles.putIfAbsent(sId, role.getName() != null ? role.getName() : "Study Member");
                    }
                }
            }

            Set<UUID> allStudyIds = new LinkedHashSet<>();
            allStudyIds.addAll(studyRoles.keySet());
            allStudyIds.addAll(studyPermissions.keySet());

            List<UserStudyAccessResponse> studies = new ArrayList<>(allStudyIds.size());
            for (UUID studyId : allStudyIds) {
                Study study = studiesById.get(studyId);
                String studyName = study != null ? study.getName()
                        : "Assigned Study (" + studyId.toString().substring(0, Math.min(8, studyId.toString().length())).toUpperCase() + ")";
                String sRole = studyRoles.get(studyId);
                String sPerm = studyPermissions.get(studyId);

                if (sPerm == null) {
                    for (UserRoleAssignment assignment : userAssignments) {
                        if (!SitePermissionService.isAssignmentEffective(assignment, now)) {
                            continue;
                        }
                        if (studyId.equals(assignment.getStudyId())) {
                            Role role = rolesById.get(assignment.getRoleId());
                            if (role != null && role.isActive() && "STUDY".equalsIgnoreCase(role.getScopeType())) {
                                sPerm = role.getCode();
                                break;
                            }
                        }
                    }
                }

                studies.add(new UserStudyAccessResponse(
                        studyId,
                        studyName,
                        sRole != null ? sRole : "Study Member",
                        sPerm
                ));
            }

            item.setStudies(studies);
            response.add(item);
        }

        return response;
    }
}
