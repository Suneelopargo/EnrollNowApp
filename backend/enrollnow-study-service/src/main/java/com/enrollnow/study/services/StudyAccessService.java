package com.enrollnow.study.services;

import com.enrollnow.common.audit.AuditChange;
import com.enrollnow.common.audit.AuditOperation;
import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.exceptions.InvalidRoleAssignmentException;
import com.enrollnow.identity.exceptions.RoleNotFoundException;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.study.dtos.GrantStudyAccessRequest;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

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
        if (tenantId == null || studyId == null || targetUserId == null) {
            throw new AccessDeniedException("Access denied: tenant, study, and target user context are required");
        }
        if (siteAuthorizationService == null || sitePermissionService == null) {
            throw new AccessDeniedException("Access denied: authorization service is not configured");
        }
        SiteAuthorizationService.CallerIdentity caller = siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to modify study access"));
        if (caller.userId() == null || caller.tenantId() == null) {
            throw new AccessDeniedException("Access denied: incomplete caller security context");
        }
        siteAuthorizationService.requireTenantMatch(tenantId);

        UserEffectivePermissionsResponse callerEffective =
                sitePermissionService.resolveEffectivePermissions(tenantId, caller.userId(), null);
        if (callerEffective == null) {
            throw new AccessDeniedException("Access denied: unable to resolve caller permissions");
        }

        // 1. SITE_ADMIN has full study access management across the site
        if (callerEffective.isCanManageSiteAdmins()
                || (callerEffective.getPermissions() != null
                && callerEffective.getPermissions().contains(SitePermissionService.PERM_SITE_ALL_STUDIES_MANAGE))) {
            return;
        }

        // Non-Site-Admin callers can never grant or modify their own study access
        if (caller.userId().equals(targetUserId)) {
            throw new AccessDeniedException("Access denied: users cannot modify their own study access");
        }

        // 2. STUDY_ADMIN on this specific study can manage study access for other users
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
        grantStudyAccess(
                tenantId,
                studyId,
                userId,
                request,
                null
        );
    }

    @Transactional
    public void removeStudyAccess(
            UUID tenantId,
            UUID studyId,
            UUID userId
    ) {
        removeStudyAccess(
                tenantId,
                studyId,
                userId,
                null
        );
    }
    
    @Transactional
    public void grantStudyAccess(
            UUID tenantId,
            UUID studyId,
            UUID userId,
            GrantStudyAccessRequest request,
            AuditOperation auditOperation
    ) {
    	requireStudyAccessManageAuthorization(tenantId, studyId, userId);

        // 1. Validate study belongs to tenant
        Study study = studyRepository.findByTenantIdAndId(tenantId, studyId)
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

                if (auditOperation != null) {

                    auditOperation.addChange(
                            "STUDY",
                            studyId,
                            "studyPermission",
                            previousRoleCode,
                            role.getCode()
                    );

                } else if (auditRecorder != null) {

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
                                            "studyName", study.getName() != null ? study.getName() : "",
                                            "studyPermission", previousRoleCode
                                    ),
                                    Map.of(
                                            "studyId", studyId,
                                            "studyName", study.getName() != null ? study.getName() : "",
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

            if (auditOperation != null) {

                auditOperation.addChange(
                        "STUDY",
                        studyId,
                        "studyPermission",
                        "NONE",
                        role.getCode()
                );

            } else if (auditRecorder != null) {

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
                                        "studyName", study.getName() != null ? study.getName() : "",
                                        "studyPermission", "NONE"
                                ),
                                Map.of(
                                        "studyId", studyId,
                                        "studyName", study.getName() != null ? study.getName() : "",
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
            UUID userId,
            AuditOperation auditOperation
    ) {
    	requireStudyAccessManageAuthorization(tenantId, studyId, userId);

        // Validate study belongs to tenant
        Study study = studyRepository.findByTenantIdAndId(tenantId, studyId)
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

            if (auditOperation != null) {

                auditOperation.addChange(
                        "STUDY",
                        studyId,
                        "studyPermission",
                        previousRoleCode,
                        "NONE"
                );

            } else if (auditRecorder != null) {

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
                                        "studyName", study.getName() != null
                                                ? study.getName()
                                                : "",
                                        "studyPermission", previousRoleCode
                                ),
                                Map.of(
                                        "studyId", studyId,
                                        "studyName", study.getName() != null
                                                ? study.getName()
                                                : "",
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
