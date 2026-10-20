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
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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

        OffsetDateTime now = OffsetDateTime.now();
        UUID defaultTenantSiteId = requestedSiteId;
        if (defaultTenantSiteId == null && siteRepository != null) {
            defaultTenantSiteId = siteRepository
                    .findFirstByTenantIdAndActiveTrueOrderByNameAsc(tenantId)
                    .map(Site::getId)
                    .orElseGet(() -> siteRepository.findFirstByTenantId(tenantId).map(Site::getId).orElse(null));
        }

        List<User> users = userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<UserListItemResponse> response = new ArrayList<>();

        for (User user : users) {

            UserListItemResponse item = new UserListItemResponse();

            item.setId(user.getId());
            item.setFirstName(user.getFirstName());
            item.setLastName(user.getLastName());
            item.setTitle(user.getTitle());
            item.setStatus(user.getStatus());
            item.setCreatedAt(user.getCreatedAt());

            UserEmail primaryEmail =
                    userEmailRepository
                            .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                                    tenantId,
                                    user.getId())
                            .orElse(null);

            if (primaryEmail != null) {
                item.setPrimaryEmail(primaryEmail.getEmail());
            }

            String sitePermission = "NONE";
            UUID resolvedUserSiteId = requestedSiteId != null ? requestedSiteId : defaultTenantSiteId;

            List<UserRoleAssignment> siteAssignments =
                    requestedSiteId != null
                            ? userRoleAssignmentRepository.findByTenantIdAndUserIdAndSiteIdAndActiveTrue(
                                    tenantId,
                                    user.getId(),
                                    requestedSiteId
                            )
                            : userRoleAssignmentRepository.findByTenantIdAndUserIdAndSiteIdIsNotNullAndActiveTrue(
                                    tenantId,
                                    user.getId()
                            );

            int highestPriority = 0;
            for (UserRoleAssignment assignment : siteAssignments) {
                if (!SitePermissionService.isAssignmentEffective(assignment, now)) {
                    continue;
                }
                if (assignment.getTeamId() != null || assignment.getStudyId() != null) {
                    continue;
                }

                Role role =
                        roleRepository
                                .findById(assignment.getRoleId())
                                .orElse(null);

                if (role != null
                        && role.isActive()
                        && "SITE".equalsIgnoreCase(role.getScopeType())) {
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

            Map<UUID, String> studyRoles = new LinkedHashMap<>();
            Map<UUID, String> studyPermissions = new LinkedHashMap<>();

            // 1. Collect from study_members table
            List<StudyMember> memberships =
                    studyMemberRepository
                            .findByTenantIdAndIdUserIdAndActiveTrue(
                                    tenantId,
                                    user.getId());

            for (StudyMember membership : memberships) {
                UUID sId = membership.getId().getStudyId();
                studyRoles.put(sId, membership.getStudyRole());
            }

            // 2. Collect from user_role_assignments table
            List<UserRoleAssignment> userRoleAssignments =
                    userRoleAssignmentRepository
                            .findByTenantIdAndUserIdAndActiveTrue(
                                    tenantId,
                                    user.getId());

            for (UserRoleAssignment assignment : userRoleAssignments) {
                if (!SitePermissionService.isAssignmentEffective(assignment, now)) {
                    continue;
                }
                UUID sId = assignment.getStudyId();
                if (sId != null) {
                    Role role = roleRepository.findById(assignment.getRoleId()).orElse(null);
                    if (role != null && role.isActive() && "STUDY".equalsIgnoreCase(role.getScopeType())) {
                        studyPermissions.putIfAbsent(sId, role.getCode());
                        studyRoles.putIfAbsent(sId, role.getName() != null ? role.getName() : "Study Member");
                    }
                }
            }

            Set<UUID> allStudyIds = new LinkedHashSet<>();
            allStudyIds.addAll(studyRoles.keySet());
            allStudyIds.addAll(studyPermissions.keySet());

            List<UserStudyAccessResponse> studies = new ArrayList<>();

            for (UUID studyId : allStudyIds) {
                Study study =
                        studyRepository
                                .findByTenantIdAndId(tenantId, studyId)
                                .or(() -> studyRepository.findById(studyId))
                                .orElse(null);

                String studyName = study != null ? study.getName() : "Assigned Study (" + studyId.toString().substring(0, Math.min(8, studyId.toString().length())).toUpperCase() + ")";
                String sRole = studyRoles.get(studyId);
                String sPerm = studyPermissions.get(studyId);

                if (sPerm == null) {
                    List<UserRoleAssignment> assignments =
                            userRoleAssignmentRepository
                                    .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                                            tenantId,
                                            user.getId(),
                                            studyId);

                    for (UserRoleAssignment assignment : assignments) {
                        if (!SitePermissionService.isAssignmentEffective(assignment, now)) {
                            continue;
                        }

                        Role role =
                                roleRepository
                                        .findById(assignment.getRoleId())
                                        .orElse(null);

                        if (role != null
                                && role.isActive()
                                && "STUDY".equalsIgnoreCase(role.getScopeType())) {

                            sPerm = role.getCode();
                            break;
                        }
                    }
                }

                UserStudyAccessResponse studyResponse =
                        new UserStudyAccessResponse(
                                studyId,
                                studyName,
                                sRole != null ? sRole : "Study Member",
                                sPerm
                        );

                studies.add(studyResponse);
            }

            item.setStudies(studies);
            response.add(item);
        }

        return response;
    }
}