package com.enrollnow.studycontext.services;

import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;

import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;

import com.enrollnow.studycontext.dtos.MyStudyResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MyStudiesService {

    private final StudyMemberRepository studyMemberRepository;
    private final StudyRepository studyRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final RoleRepository roleRepository;

    public MyStudiesService(
            StudyMemberRepository studyMemberRepository,
            StudyRepository studyRepository,
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            RoleRepository roleRepository) {

        this.studyMemberRepository = studyMemberRepository;
        this.studyRepository = studyRepository;
        this.userRoleAssignmentRepository = userRoleAssignmentRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<MyStudyResponse> getMyStudies(
            UUID tenantId,
            UUID userId) {

        List<StudyMember> memberships =
                studyMemberRepository
                        .findByTenantIdAndIdUserIdAndActiveTrue(
                                tenantId,
                                userId
                        );

        List<MyStudyResponse> response = new ArrayList<>();

        for (StudyMember membership : memberships) {

            UUID studyId = membership.getId().getStudyId();

            Study study =
                    studyRepository
                            .findByTenantIdAndId(
                                    tenantId,
                                    studyId
                            )
                            .orElse(null);

            if (study == null) {
                continue;
            }

            String studyPermission = null;

            List<UserRoleAssignment> assignments =
                    userRoleAssignmentRepository
                            .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                                    tenantId,
                                    userId,
                                    studyId
                            );

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

            response.add(
                    new MyStudyResponse(
                            study.getId(),
                            study.getStudyCode(),
                            study.getName(),
                            membership.getStudyRole(),
                            studyPermission
                    )
            );
        }

        return response;
    }
}