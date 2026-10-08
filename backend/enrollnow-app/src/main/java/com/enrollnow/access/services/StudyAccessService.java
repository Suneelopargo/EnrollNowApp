package com.enrollnow.access.services;

import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.study.repositories.StudyMemberRepository;

import com.enrollnow.identity.dtos.GrantStudyAccessRequest;
import com.enrollnow.identity.exceptions.InvalidRoleAssignmentException;
import com.enrollnow.identity.exceptions.RoleNotFoundException;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class StudyAccessService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final StudyMemberRepository studyMemberRepository;

    public StudyAccessService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            StudyMemberRepository studyMemberRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleAssignmentRepository = userRoleAssignmentRepository;
        this.studyMemberRepository = studyMemberRepository;
    }
    
    @Transactional
    public void grantStudyAccess(
            UUID tenantId,
            UUID studyId,
            UUID userId,
            GrantStudyAccessRequest request
    ) {

        // 1. Validate user belongs to tenant
        userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // 2. Resolve requested study permission role
        String permissionCode =
                request.getStudyPermission()
                        .trim()
                        .toUpperCase(Locale.ROOT);

        Role role = roleRepository.findByCode(permissionCode)
                .orElseThrow(() ->
                        new RoleNotFoundException(permissionCode)
                );

        // 3. Grant Study Access only accepts STUDY-scoped roles
        if (!"STUDY".equalsIgnoreCase(role.getScopeType())) {
            throw new InvalidRoleAssignmentException(
                    "Role " + role.getCode()
                            + " is not a STUDY scoped role"
            );
        }

        // 4. Create or reactivate study membership
        StudyMember studyMember =
                studyMemberRepository
                        .findByTenantIdAndIdStudyIdAndIdUserId(
                                tenantId,
                                studyId,
                                userId
                        )
                        .orElseGet(() -> {
                            StudyMember member = new StudyMember();
                            member.setId(
                                    new StudyMemberId(
                                            studyId,
                                            userId
                                    )
                            );
                            member.setTenantId(tenantId);
                            return member;
                        });

        studyMember.setActive(true);

        studyMember.setStudyRole(
                request.getStudyRole() == null
                        ? null
                        : request.getStudyRole().trim()
        );

        studyMemberRepository.save(studyMember);
        
        List<UserRoleAssignment> activeStudyAssignments =
                userRoleAssignmentRepository
                        .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                                tenantId,
                                userId,
                                studyId
                        );

        for (UserRoleAssignment existingAssignment : activeStudyAssignments) {

            if (!existingAssignment.getRoleId().equals(role.getId())) {
                existingAssignment.setActive(false);
                userRoleAssignmentRepository.save(existingAssignment);
            }
        }

        // 5. Check whether this exact study permission is already active
        boolean alreadyAssigned =
                userRoleAssignmentRepository
                        .existsByTenantIdAndUserIdAndRoleIdAndStudyIdAndActiveTrue(
                                tenantId,
                                userId,
                                role.getId(),
                                studyId
                        );

        if (!alreadyAssigned) {

            UserRoleAssignment assignment =
                    new UserRoleAssignment();

            assignment.setTenantId(tenantId);
            assignment.setUserId(userId);
            assignment.setRoleId(role.getId());
            assignment.setStudyId(studyId);
            assignment.setActive(true);

            userRoleAssignmentRepository.save(assignment);
        }
    }
}