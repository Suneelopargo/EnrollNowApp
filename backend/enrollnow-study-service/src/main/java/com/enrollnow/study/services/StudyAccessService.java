package com.enrollnow.study.services;

import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;

import com.enrollnow.common.audit.AuditChange;
import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;

import java.util.Map;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.exceptions.StudyNotFoundException;

import com.enrollnow.study.dtos.GrantStudyAccessRequest;
import com.enrollnow.identity.exceptions.InvalidRoleAssignmentException;
import com.enrollnow.identity.exceptions.RoleNotFoundException;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class StudyAccessService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final StudyRepository studyRepository;
    private final SitePermissionService sitePermissionService;
    private final SiteAuthorizationService siteAuthorizationService;
    private final AuditRecorder auditRecorder;

    @Autowired
    public StudyAccessService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            StudyMemberRepository studyMemberRepository,
            StudyRepository studyRepository,
            SitePermissionService sitePermissionService,
            SiteAuthorizationService siteAuthorizationService,
            AuditRecorder auditRecorder
    ) {
        this.userRepository = Objects.requireNonNull(userRepository, "userRepository must not be null");
        this.roleRepository = Objects.requireNonNull(roleRepository, "roleRepository must not be null");
        this.userRoleAssignmentRepository = Objects.requireNonNull(userRoleAssignmentRepository, "userRoleAssignmentRepository must not be null");
        this.studyMemberRepository = Objects.requireNonNull(studyMemberRepository, "studyMemberRepository must not be null");
        this.studyRepository = Objects.requireNonNull(studyRepository, "studyRepository must not be null");
        this.sitePermissionService = Objects.requireNonNull(sitePermissionService, "sitePermissionService must not be null");
        this.siteAuthorizationService = Objects.requireNonNull(siteAuthorizationService, "siteAuthorizationService must not be null");
        this.auditRecorder = Objects.requireNonNull(auditRecorder, "auditRecorder must not be null");
    }

    @Transactional(readOnly = true)
    public void requireStudyAccessManageAuthorization(
            UUID tenantId,
            UUID studyId,
            UUID targetUserId
    ) {
        if (siteAuthorizationService == null || sitePermissionService == null) {
            throw new AccessDeniedException("Access denied: authorization service is not configured");
        }
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to modify study access"));
        siteAuthorizationService.requireTenantMatch(tenantId);

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(tenantId, caller.userId(), null);

        // 1. SITE_ADMIN has full study access management across the site
        if (callerEffective.isCanManageSiteAdmins()
                || callerEffective.getPermissions().contains(SitePermissionService.PERM_SITE_ALL_STUDIES_MANAGE)) {
            return;
        }

        // 2. STUDY_ADMIN on this specific study can manage study access
        OffsetDateTime now = OffsetDateTime.now();
        List<UserRoleAssignment> callerStudyAssignments =
                userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                        tenantId,
                        caller.userId(),
                        studyId
                );
        boolean isStudyAdminOnStudy = callerStudyAssignments.stream()
                .filter(a -> SitePermissionService.isAssignmentEffective(a, now))
                .map(a -> roleRepository.findById(a.getRoleId()).orElse(null))
                .anyMatch(r -> r != null && "STUDY_ADMIN".equalsIgnoreCase(r.getCode()));
        if (isStudyAdminOnStudy) {
            return;
        }

        // 3. SITE_MANAGER can manage study access on studies where they are an active member (and not modifying themselves)
        if (SitePermissionService.ROLE_SITE_MANAGER.equalsIgnoreCase(callerEffective.getSiteRole())) {
            if (caller.userId().equals(targetUserId)) {
                throw new AccessDeniedException("Access denied: Site Managers cannot modify their own study access");
            }
            boolean isMemberOfStudy = studyMemberRepository
                    .findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, caller.userId())
                    .map(StudyMember::isActive)
                    .orElse(false)
                    || !callerStudyAssignments.isEmpty();
            if (isMemberOfStudy) {
                return;
            }
        }

        throw new AccessDeniedException("Access denied: insufficient permissions to modify study access");
    }
    
    @Transactional
    public void grantStudyAccess(
            UUID tenantId,
            UUID studyId,
            UUID userId,
            GrantStudyAccessRequest request
    ) {
        requireStudyAccessManageAuthorization(tenantId, studyId, userId);

        // 1. Validate study belongs to tenant
        studyRepository.findByTenantIdAndId(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException(studyId));

        // 2. Validate user belongs to tenant
        userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // 3. Resolve requested study permission role
        String permissionCode =
                request.getStudyPermission()
                        .trim()
                        .toUpperCase(Locale.ROOT);

        Role role = roleRepository.findByCode(permissionCode)
                .orElseThrow(() ->
                        new RoleNotFoundException(permissionCode)
                );

        // 4. Grant Study Access only accepts STUDY-scoped roles
        if (!"STUDY".equalsIgnoreCase(role.getScopeType())) {
            throw new InvalidRoleAssignmentException(
                    "Role " + role.getCode()
                            + " is not a STUDY scoped role"
            );
        }

        // 5. Create or reactivate study membership
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

        UserRoleAssignment targetAssignment = null;
        for (UserRoleAssignment existingAssignment : activeStudyAssignments) {
            if (targetAssignment == null) {
                targetAssignment = existingAssignment;
            } else {
                existingAssignment.setActive(false);
                userRoleAssignmentRepository.save(existingAssignment);
            }
        }

        if (targetAssignment != null) {

            if (!targetAssignment.getRoleId().equals(role.getId())) {

                String previousRoleCode = roleRepository
                        .findById(targetAssignment.getRoleId())
                        .map(Role::getCode)
                        .orElse("UNKNOWN");

                targetAssignment.setRoleId(role.getId());
                targetAssignment.setActive(true);

                userRoleAssignmentRepository.saveAndFlush(targetAssignment);

                if (auditRecorder != null) {
                    auditRecorder.record(
                            new AuditEventCommand(
                                    tenantId,
                                    null,
                                    "USER",
                                    userId,
                                    "STUDY_PERMISSION_CHANGED",
                                    "User study permission changed",
                                    "API",
                                    null,
                                    null,
                                    Map.of(
                                            "studyId", studyId,
                                            "studyPermission", previousRoleCode
                                    ),
                                    Map.of(
                                            "studyId", studyId,
                                            "studyPermission", role.getCode()
                                    ),
                                    List.of(
                                            new AuditChange(
                                                    "studyPermission",
                                                    previousRoleCode,
                                                    role.getCode()
                                            )
                                    )
                            )
                    );
                }
            }

        } else {

            UserRoleAssignment assignment = new UserRoleAssignment();
            assignment.setTenantId(tenantId);
            assignment.setUserId(userId);
            assignment.setRoleId(role.getId());
            assignment.setStudyId(studyId);
            assignment.setActive(true);

            userRoleAssignmentRepository.save(assignment);

            if (auditRecorder != null) {
                auditRecorder.record(
                        new AuditEventCommand(
                                tenantId,
                                null,
                                "USER",
                                userId,
                                "STUDY_ACCESS_GRANTED",
                                "User granted access to study",
                                "API",
                                null,
                                null,
                                Map.of(
                                        "studyId", studyId,
                                        "studyPermission", "NONE"
                                ),
                                Map.of(
                                        "studyId", studyId,
                                        "studyPermission", role.getCode()
                                ),
                                List.of(
                                        new AuditChange(
                                                "studyPermission",
                                                "NONE",
                                                role.getCode()
                                        )
                                )
                        )
                );
            }
        }
    }
    
    @Transactional
    public void removeStudyAccess(
            UUID tenantId,
            UUID studyId,
            UUID userId) {
        requireStudyAccessManageAuthorization(tenantId, studyId, userId);

        // Validate study belongs to tenant
        studyRepository.findByTenantIdAndId(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException(studyId));

        userRepository
                .findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        studyMemberRepository
                .findByTenantIdAndIdStudyIdAndIdUserId(
                        tenantId,
                        studyId,
                        userId
                )
                .ifPresent(member -> {
                    member.setActive(false);
                    studyMemberRepository.save(member);
                });

        List<UserRoleAssignment> activeAssignments =
                userRoleAssignmentRepository
                        .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                                tenantId,
                                userId,
                                studyId
                        );

        for (UserRoleAssignment assignment : activeAssignments) {

            String previousRoleCode = roleRepository
                    .findById(assignment.getRoleId())
                    .map(Role::getCode)
                    .orElse("UNKNOWN");

            assignment.setActive(false);
            userRoleAssignmentRepository.save(assignment);

            if (auditRecorder != null) {
                auditRecorder.record(
                        new AuditEventCommand(
                                tenantId,
                                null,
                                "USER",
                                userId,
                                "STUDY_ACCESS_REMOVED",
                                "User study access removed",
                                "API",
                                null,
                                null,
                                Map.of(
                                        "studyId", studyId,
                                        "studyPermission", previousRoleCode
                                ),
                                Map.of(
                                        "studyId", studyId,
                                        "studyPermission", "NONE"
                                ),
                                List.of(
                                        new AuditChange(
                                                "studyPermission",
                                                previousRoleCode,
                                                "NONE"
                                        )
                                )
                        )
                );
            }
        }
    }
}
