package com.enrollnow.usermanagement.services;

import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;

import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;

import com.enrollnow.usermanagement.dtos.UserListItemResponse;
import com.enrollnow.usermanagement.dtos.UserStudyAccessResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UserManagementQueryService {

    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final StudyRepository studyRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final RoleRepository roleRepository;

    public UserManagementQueryService(
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            StudyMemberRepository studyMemberRepository,
            StudyRepository studyRepository,
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            RoleRepository roleRepository) {

        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.studyMemberRepository = studyMemberRepository;
        this.studyRepository = studyRepository;
        this.userRoleAssignmentRepository = userRoleAssignmentRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<UserListItemResponse> getUsers(UUID tenantId) {

        List<User> users = userRepository.findByTenantId(tenantId);
        List<UserListItemResponse> response = new ArrayList<>();

        for (User user : users) {

            UserListItemResponse item = new UserListItemResponse();

            item.setId(user.getId());
            item.setFirstName(user.getFirstName());
            item.setLastName(user.getLastName());
            item.setTitle(user.getTitle());
            item.setStatus(user.getStatus());

            UserEmail primaryEmail =
                    userEmailRepository
                            .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                                    tenantId,
                                    user.getId())
                            .orElse(null);

            if (primaryEmail != null) {
                item.setPrimaryEmail(primaryEmail.getEmail());
            }

            /*
             * Site Permission is intentionally not populated yet.
             * Customer clarification is still pending.
             */
            item.setSitePermission(null);

            List<StudyMember> memberships =
                    studyMemberRepository
                            .findByTenantIdAndIdUserIdAndActiveTrue(
                                    tenantId,
                                    user.getId());

            List<UserStudyAccessResponse> studies = new ArrayList<>();

            for (StudyMember membership : memberships) {

                UUID studyId = membership.getId().getStudyId();

                Study study =
                        studyRepository
                                .findByTenantIdAndId(tenantId, studyId)
                                .orElse(null);

                if (study == null) {
                    continue;
                }

                String studyPermission = null;

                List<UserRoleAssignment> assignments =
                        userRoleAssignmentRepository
                                .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                                        tenantId,
                                        user.getId(),
                                        studyId);

                for (UserRoleAssignment assignment : assignments) {

                    Role role =
                            roleRepository
                                    .findById(assignment.getRoleId())
                                    .orElse(null);

                    if (role != null
                            && "STUDY".equalsIgnoreCase(role.getScopeType())) {

                        studyPermission = role.getCode();
                        break;
                    }
                }

                UserStudyAccessResponse studyResponse =
                        new UserStudyAccessResponse(
                                study.getId(),
                                study.getName(),
                                membership.getStudyRole(),
                                studyPermission
                        );

                studies.add(studyResponse);
            }

            item.setStudies(studies);
            response.add(item);
        }

        return response;
    }
}