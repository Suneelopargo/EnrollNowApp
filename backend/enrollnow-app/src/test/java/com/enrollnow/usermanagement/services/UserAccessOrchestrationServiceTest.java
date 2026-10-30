package com.enrollnow.usermanagement.services;

import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditOperation;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.services.UserService;
import com.enrollnow.study.services.StudyAccessService;
import com.enrollnow.usermanagement.dtos.UpdateUserAccessRequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAccessOrchestrationServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private StudyAccessService studyAccessService;

    @Mock
    private AuditRecorder auditRecorder;

    @Test
    void updateUserAccess_AggregatesChangesIntoSingleAuditEvent() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID siteId = UUID.randomUUID();
        UUID studyId = UUID.randomUUID();

        UserAccessOrchestrationService service =
                new UserAccessOrchestrationService(
                        userService,
                        studyAccessService,
                        auditRecorder
                );

        /*
         * User profile
         */
        UpdateUserRequest userRequest =
                new UpdateUserRequest();

        userRequest.setFirstName("Jane");
        userRequest.setLastName("Smith");
        userRequest.setTitle("Manager");
        userRequest.setTimezone("Asia/Kolkata");

        /*
         * Site access
         */
        UpdateUserAccessRequest.SiteAccessRequest siteAccess =
                new UpdateUserAccessRequest.SiteAccessRequest();

        siteAccess.setSiteId(siteId);
        siteAccess.setSitePermission("SITE_ADMIN");

        /*
         * Study access
         */
        UpdateUserAccessRequest.StudyAccessItemRequest studyAccess =
                new UpdateUserAccessRequest.StudyAccessItemRequest();

        studyAccess.setStudyId(studyId);
        studyAccess.setStudyRole("Study Coordinator");
        studyAccess.setStudyPermission("STUDY_ADMIN");

        UpdateUserAccessRequest request =
                new UpdateUserAccessRequest();

        request.setUser(userRequest);
        request.setSiteAccess(siteAccess);
        request.setStudies(List.of(studyAccess));

        /*
         * Simulate UserService contributing a parent USER change.
         */
        doAnswer(invocation -> {

            AuditOperation operation =
                    invocation.getArgument(3);

            operation.addChange(
                    "firstName",
                    "John",
                    "Jane"
            );

            return null;

        }).when(userService).updateUser(
                eq(tenantId),
                eq(userId),
                eq(userRequest),
                any(AuditOperation.class)
        );

        /*
         * Simulate SITE role service contributing another USER change.
         */
        doAnswer(invocation -> {

            AuditOperation operation =
                    invocation.getArgument(3);

            operation.addChange(
                    "USER",
                    userId,
                    "sitePermission",
                    "SITE_MANAGER",
                    "SITE_ADMIN"
            );

            return null;

        }).when(userService).assignRole(
                eq(tenantId),
                eq(userId),
                any(),
                any(AuditOperation.class)
        );

        /*
         * Simulate StudyAccessService contributing a STUDY child change.
         */
        doAnswer(invocation -> {

            AuditOperation operation =
                    invocation.getArgument(4);

            operation.addChange(
                    "STUDY",
                    studyId,
                    "studyPermission",
                    "STUDY_RA",
                    "STUDY_ADMIN"
            );

            return null;

        }).when(studyAccessService).grantStudyAccess(
                eq(tenantId),
                eq(studyId),
                eq(userId),
                any(),
                any(AuditOperation.class)
        );

        service.updateUserAccess(
                tenantId,
                userId,
                request
        );

        /*
         * The orchestration layer must persist ONE event only.
         */
        ArgumentCaptor<AuditEventCommand> commandCaptor =
                ArgumentCaptor.forClass(AuditEventCommand.class);

        verify(auditRecorder, times(1))
                .record(commandCaptor.capture());

        AuditEventCommand command =
                commandCaptor.getValue();

        assertEquals(
                tenantId,
                command.tenantId()
        );

        assertEquals(
                "USER",
                command.entityType()
        );

        assertEquals(
                userId,
                command.entityId()
        );

        assertEquals(
                "USER_ACCESS_UPDATED",
                command.action()
        );

        /*
         * Three business changes were collected into the same event.
         */
        assertEquals(
                3,
                command.changes().size()
        );

        assertEquals(
                "firstName",
                command.changes().get(0).fieldName()
        );

        assertEquals(
                "sitePermission",
                command.changes().get(1).fieldName()
        );

        assertEquals(
                "studyPermission",
                command.changes().get(2).fieldName()
        );

        /*
         * Study change must retain its own child entity identity.
         */
        assertEquals(
                "STUDY",
                command.changes().get(2).entityType()
        );

        assertEquals(
                studyId,
                command.changes().get(2).entityId()
        );
    }
    
    @Test
    void updateUserAccess_DoesNotCreateAuditEvent_WhenNothingChanged() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        UserAccessOrchestrationService service =
                new UserAccessOrchestrationService(
                        userService,
                        studyAccessService,
                        auditRecorder
                );

        UpdateUserRequest userRequest =
                new UpdateUserRequest();

        userRequest.setFirstName("John");
        userRequest.setLastName("Smith");
        userRequest.setTitle("Manager");
        userRequest.setTimezone("Asia/Kolkata");

        UpdateUserAccessRequest request =
                new UpdateUserAccessRequest();

        request.setUser(userRequest);

        /*
         * Mock UserService without adding anything
         * to the supplied AuditOperation.
         */
        when(userService.updateUser(
                eq(tenantId),
                eq(userId),
                eq(userRequest),
                any(AuditOperation.class)
        )).thenReturn(null);

        service.updateUserAccess(
                tenantId,
                userId,
                request
        );

        verify(auditRecorder, never())
                .record(any(AuditEventCommand.class));
    }
}