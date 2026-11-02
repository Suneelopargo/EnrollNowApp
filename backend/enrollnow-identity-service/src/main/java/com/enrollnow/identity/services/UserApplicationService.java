package com.enrollnow.identity.services;

import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditRequest;
import com.enrollnow.identity.dtos.CreateUserRequest;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.dtos.UserSummaryResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UserApplicationService {

    private final UserService userService;
    private final AuditRecorder auditRecorder;

    public UserApplicationService(
            UserService userService,
            AuditRecorder auditRecorder
    ) {
        this.userService = userService;
        this.auditRecorder = auditRecorder;
    }

    @Transactional
    public UserSummaryResponse updateUser(
            UUID tenantId,
            UUID userId,
            UpdateUserRequest request
    ) {

        /*
         * 1. Capture actual DB state before update.
         */
        Map<String, Object> before =
                userService.getUserAuditSnapshot(
                        tenantId,
                        userId
                );

        /*
         * 2. Perform normal business operation.
         */
        UserSummaryResponse response =
                userService.updateUser(
                        tenantId,
                        userId,
                        request
                );

        /*
         * 3. Capture resulting persisted state.
         */
        Map<String, Object> after =
                userService.getUserAuditSnapshot(
                        tenantId,
                        userId
                );

        /*
         * 4. Audit implicitly.
         *
         * AuditRecorder will:
         * - compare before/after
         * - ignore unchanged fields
         * - create field history
         * - suppress the event completely if nothing changed
         */
        auditRecorder.record(
                new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_UPDATED",
                        "User updated",
                        "API",
                        List.of(
                                new AuditEntitySnapshot(
                                        "USER",
                                        userId,
                                        before,
                                        after
                                )
                        )
                )
        );

        return response;
    }
    
    @Transactional
    public UserSummaryResponse createUser(
            UUID tenantId,
            CreateUserRequest request
    ) {

        UserSummaryResponse createdUser =
                userService.createUser(
                        tenantId,
                        request
                );

        UUID userId = createdUser.getId();

        Map<String, Object> after =
                userService.getUserAuditSnapshot(
                        tenantId,
                        userId
                );

        auditRecorder.record(
                new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_CREATED",
                        "User account created",
                        "API",
                        List.of(
                                new AuditEntitySnapshot(
                                        "USER",
                                        userId,
                                        null,
                                        after
                                )
                        )
                )
        );

        return createdUser;
    }
    
    @Transactional
    public UserSummaryResponse deactivateUser(
            UUID tenantId,
            UUID userId
    ) {

        Map<String, Object> beforeSnapshot =
                userService.getUserAuditSnapshot(
                        tenantId,
                        userId
                );

        UserSummaryResponse response =
                userService.deactivateUser(
                        tenantId,
                        userId
                );

        Map<String, Object> afterSnapshot =
                userService.getUserAuditSnapshot(
                        tenantId,
                        userId
                );

        Map<String, Object> beforeData = Map.of(
                "status", beforeSnapshot.get("status")
        );

        Map<String, Object> afterData = Map.of(
                "status", afterSnapshot.get("status")
        );

        auditRecorder.record(
                new AuditEventCommand(
                        tenantId,
                        null,
                        "USER",
                        userId,
                        "USER_DEACTIVATED",
                        "User account deactivated",
                        "API",
                        null,
                        null,
                        beforeData,
                        afterData,
                        null
                )
        );
        return response;
    }

    @Transactional
    public UserSummaryResponse activateUser(
            UUID tenantId,
            UUID userId
    ) {

        Map<String, Object> beforeSnapshot =
                userService.getUserAuditSnapshot(
                        tenantId,
                        userId
                );

        UserSummaryResponse response =
                userService.activateUser(
                        tenantId,
                        userId
                );

        Map<String, Object> afterSnapshot =
                userService.getUserAuditSnapshot(
                        tenantId,
                        userId
                );

        Map<String, Object> beforeData = Map.of(
                "status", beforeSnapshot.get("status")
        );

        Map<String, Object> afterData = Map.of(
                "status", afterSnapshot.get("status")
        );

        auditRecorder.record(
                new AuditEventCommand(
                        tenantId,
                        null,
                        "USER",
                        userId,
                        "USER_ACTIVATED",
                        "User account activated",
                        "API",
                        null,
                        null,
                        beforeData,
                        afterData,
                        null
                )
        );

        return response;
    }
}