package com.enrollnow.usermanagement.services;

import java.util.UUID;

import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.services.UserService;
import com.enrollnow.study.services.StudyAccessService;
import com.enrollnow.usermanagement.dtos.UpdateUserAccessRequest;
import org.springframework.stereotype.Service;


import com.enrollnow.common.audit.AuditOperation;
import com.enrollnow.identity.dtos.AssignRoleRequest;
import com.enrollnow.study.dtos.GrantStudyAccessRequest;




import org.springframework.transaction.annotation.Transactional;


@Service
public class UserAccessOrchestrationService {

    private final UserService userService;
    private final StudyAccessService studyAccessService;
    private final AuditRecorder auditRecorder;

    public UserAccessOrchestrationService(
            UserService userService,
            StudyAccessService studyAccessService,
            AuditRecorder auditRecorder
    ) {
        this.userService = userService;
        this.studyAccessService = studyAccessService;
        this.auditRecorder = auditRecorder;
    }

    @Transactional
    public void updateUserAccess(
            UUID tenantId,
            UUID userId,
            UpdateUserAccessRequest request
    ) {

        AuditOperation auditOperation =
                new AuditOperation(
                        tenantId,
                        "USER",
                        userId,
                        "USER_ACCESS_UPDATED",
                        "User access updated",
                        "API"
                );

        /*
         * 1. Update user profile
         */
        if (request.getUser() != null) {

            userService.updateUser(
                    tenantId,
                    userId,
                    request.getUser(),
                    auditOperation
            );
        }

        /*
         * 2. Update site access
         */
        if (request.getSiteAccess() != null) {

            UpdateUserAccessRequest.SiteAccessRequest siteAccess =
                    request.getSiteAccess();

            String sitePermission =
                    siteAccess.getSitePermission();

            if (sitePermission == null
                    || sitePermission.isBlank()
                    || "NONE".equalsIgnoreCase(sitePermission)) {

                userService.removeSiteRole(
                        tenantId,
                        userId,
                        siteAccess.getSiteId(),
                        auditOperation
                );

            } else {

                AssignRoleRequest assignRoleRequest =
                        new AssignRoleRequest(
                                sitePermission,
                                "SITE",
                                siteAccess.getSiteId()
                        );

                userService.assignRole(
                        tenantId,
                        userId,
                        assignRoleRequest,
                        auditOperation
                );
            }
        }

        /*
         * 3. Update study access
         */
        if (request.getStudies() != null) {

            for (UpdateUserAccessRequest.StudyAccessItemRequest studyAccess
                    : request.getStudies()) {

                if (studyAccess == null) {
                    continue;
                }

                String studyPermission =
                        studyAccess.getStudyPermission();

                if (studyPermission == null
                        || studyPermission.isBlank()
                        || "NONE".equalsIgnoreCase(studyPermission)) {

                    studyAccessService.removeStudyAccess(
                            tenantId,
                            studyAccess.getStudyId(),
                            userId,
                            auditOperation
                    );

                } else {

                    GrantStudyAccessRequest grantRequest =
                            new GrantStudyAccessRequest();

                    grantRequest.setStudyRole(
                            studyAccess.getStudyRole()
                    );

                    grantRequest.setStudyPermission(
                            studyPermission
                    );

                    studyAccessService.grantStudyAccess(
                            tenantId,
                            studyAccess.getStudyId(),
                            userId,
                            grantRequest,
                            auditOperation
                    );
                }
            }
        }

        /*
         * 4. Persist exactly one audit event for this business operation.
         */
        if (auditOperation.hasChanges()) {

            auditRecorder.record(
                    auditOperation.toCommand()
            );
        }
    }
}