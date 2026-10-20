package com.enrollnow.study.services;

import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;

import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;

import com.enrollnow.study.dtos.MyStudyResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MyStudiesService {

    private static class StudyAssignmentMetadata {
        String studyRole;
        String studyPermission;

        StudyAssignmentMetadata(String studyRole, String studyPermission) {
            this.studyRole = studyRole;
            this.studyPermission = studyPermission;
        }
    }

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

        Map<UUID, StudyAssignmentMetadata> studyMap = new LinkedHashMap<>();

        // 1. Gather study assignments from study_members table
        List<StudyMember> memberships =
                studyMemberRepository
                        .findByTenantIdAndIdUserIdAndActiveTrue(
                                tenantId,
                                userId
                        );

        for (StudyMember membership : memberships) {
            UUID studyId = membership.getId().getStudyId();
            studyMap.put(studyId, new StudyAssignmentMetadata(membership.getStudyRole(), null));
        }

        // 2. Gather study assignments from user_role_assignments table
        List<UserRoleAssignment> roleAssignments =
                userRoleAssignmentRepository
                        .findByTenantIdAndUserIdAndActiveTrue(
                                tenantId,
                                userId
                        );

        for (UserRoleAssignment assignment : roleAssignments) {
            UUID studyId = assignment.getStudyId();
            if (studyId != null) {
                Role role = roleRepository.findById(assignment.getRoleId()).orElse(null);
                String roleCode = role != null ? role.getCode() : null;
                String roleName = role != null && role.getName() != null ? role.getName() : "Study Member";

                StudyAssignmentMetadata existing = studyMap.get(studyId);
                if (existing == null) {
                    studyMap.put(studyId, new StudyAssignmentMetadata(roleName, roleCode));
                } else {
                    if (existing.studyPermission == null && roleCode != null) {
                        existing.studyPermission = roleCode;
                    }
                    if (existing.studyRole == null) {
                        existing.studyRole = roleName;
                    }
                }
            }
        }

        List<MyStudyResponse> response = new ArrayList<>();

        for (Map.Entry<UUID, StudyAssignmentMetadata> entry : studyMap.entrySet()) {
            UUID studyId = entry.getKey();
            StudyAssignmentMetadata metadata = entry.getValue();

            Study study = studyRepository.findByTenantIdAndId(tenantId, studyId)
                    .or(() -> studyRepository.findById(studyId))
                    .orElse(null);

            String studyCode;
            String studyName;
            if (study != null) {
                studyCode = study.getStudyCode();
                studyName = study.getName();
            } else {
                studyCode = "STUDY-" + studyId.toString().substring(0, Math.min(8, studyId.toString().length())).toUpperCase();
                studyName = "Assigned Study (" + studyCode + ")";
            }

            String studyPermission = metadata.studyPermission;
            if (studyPermission == null) {
                List<UserRoleAssignment> assignments =
                        userRoleAssignmentRepository
                                .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                                        tenantId,
                                        userId,
                                        studyId
                                );

                for (UserRoleAssignment assignment : assignments) {
                    Role role = roleRepository.findById(assignment.getRoleId()).orElse(null);
                    if (role != null && "STUDY".equalsIgnoreCase(role.getScopeType())) {
                        studyPermission = role.getCode();
                        break;
                    }
                }
            }

            response.add(
                    new MyStudyResponse(
                            studyId,
                            studyCode,
                            studyName,
                            metadata.studyRole != null ? metadata.studyRole : "Study Member",
                            studyPermission
                    )
            );
        }

        return response;
    }
}
