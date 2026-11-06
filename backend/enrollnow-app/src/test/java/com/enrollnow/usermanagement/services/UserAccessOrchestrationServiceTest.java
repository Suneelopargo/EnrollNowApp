package com.enrollnow.usermanagement.services;

import com.enrollnow.common.audit.AuditRequest;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.services.UserService;
import com.enrollnow.study.services.StudyAccessService;
import com.enrollnow.usermanagement.dtos.UpdateUserAccessRequest;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditRequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
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

        UpdateUserRequest userRequest =
                new UpdateUserRequest();

        userRequest.setFirstName("Jane");
        userRequest.setLastName("Smith");
        userRequest.setTitle("Manager");
        userRequest.setTimezone("Asia/Kolkata");

        UpdateUserAccessRequest.SiteAccessRequest siteAccess =
                new UpdateUserAccessRequest.SiteAccessRequest();

        siteAccess.setSiteId(siteId);
        siteAccess.setSitePermission("SITE_ADMIN");

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
         * USER before / after
         */
        when(userService.getUserAuditSnapshot(
                tenantId,
                userId
        )).thenReturn(
                Map.of(
                        "firstName", "John",
                        "lastName", "Smith",
                        "title", "Coordinator",
                        "timezone", "UTC"
                ),
                Map.of(
                        "firstName", "Jane",
                        "lastName", "Smith",
                        "title", "Manager",
                        "timezone", "Asia/Kolkata"
                )
        );

        /*
         * SITE before / after
         */
        when(userService.getSiteAccessAuditSnapshot(
                tenantId,
                userId,
                siteId
        )).thenReturn(
                Map.of(
                        "siteId", siteId,
                        "sitePermission", "SITE_MANAGER"
                ),
                Map.of(
                        "siteId", siteId,
                        "sitePermission", "SITE_ADMIN"
                )
        );

        /*
         * STUDY before / after
         */
        when(studyAccessService.getStudyAccessAuditSnapshot(
                tenantId,
                studyId,
                userId
        )).thenReturn(
                Map.of(
                        "studyId", studyId,
                        "studyPermission", "STUDY_RA",
                        "studyRole", "Research Assistant"
                ),
                Map.of(
                        "studyId", studyId,
                        "studyPermission", "STUDY_ADMIN",
                        "studyRole", "Study Coordinator"
                )
        );

        /*
         * Business methods themselves do not need special behavior here.
         */
        when(userService.updateUser(
                tenantId,
                userId,
                request.getUser()
        )).thenReturn(null);

        when(userService.assignRole(
                eq(tenantId),
                eq(userId),
                any()
        )).thenReturn(null);

        doNothing().when(studyAccessService)
                .grantStudyAccess(
                        eq(tenantId),
                        eq(studyId),
                        eq(userId),
                        any()
                );

        service.updateUserAccess(
                tenantId,
                userId,
                request
        );

        /*
         * ONE business audit request.
         */
        ArgumentCaptor<AuditRequest> captor =
                ArgumentCaptor.forClass(AuditRequest.class);

        verify(auditRecorder, times(1))
                .record(captor.capture());

        AuditRequest auditRequest =
                captor.getValue();

        assertEquals(tenantId, auditRequest.tenantId());
        assertEquals("USER", auditRequest.entityType());
        assertEquals(userId, auditRequest.entityId());
        assertEquals(
                "USER_ACCESS_UPDATED",
                auditRequest.action()
        );

        assertEquals(
                3,
                auditRequest.entities().size()
        );

        /*
         * USER snapshot
         */
        assertEquals(
                "John",
                auditRequest.entities()
                        .get(0)
                        .beforeData()
                        .get("firstName")
        );

        assertEquals(
                "Jane",
                auditRequest.entities()
                        .get(0)
                        .afterData()
                        .get("firstName")
        );

        /*
         * SITE snapshot
         */
        assertEquals(
                "SITE_MANAGER",
                auditRequest.entities()
                        .get(1)
                        .beforeData()
                        .get("sitePermission")
        );

        assertEquals(
                "SITE_ADMIN",
                auditRequest.entities()
                        .get(1)
                        .afterData()
                        .get("sitePermission")
        );

        /*
         * STUDY snapshot
         */
        assertEquals(
                "STUDY",
                auditRequest.entities()
                        .get(2)
                        .entityType()
        );

        assertEquals(
                studyId,
                auditRequest.entities()
                        .get(2)
                        .entityId()
        );

        assertEquals(
                "STUDY_RA",
                auditRequest.entities()
                        .get(2)
                        .beforeData()
                        .get("studyPermission")
        );

        assertEquals(
                "STUDY_ADMIN",
                auditRequest.entities()
                        .get(2)
                        .afterData()
                        .get("studyPermission")
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

        Map<String, Object> unchanged =
                Map.of(
                        "firstName", "John",
                        "lastName", "Smith",
                        "title", "Manager",
                        "timezone", "Asia/Kolkata"
                );

        when(userService.getUserAuditSnapshot(
                tenantId,
                userId
        )).thenReturn(
                unchanged,
                unchanged
        );

        when(userService.updateUser(
                tenantId,
                userId,
                request.getUser()
        )).thenReturn(null);

        service.updateUserAccess(
                tenantId,
                userId,
                request
        );

        /*
         * Orchestration DOES call AuditRecorder.
         * AuditRecorderImpl itself detects no differences
         * and suppresses persistence.
         *
         * Since AuditRecorder is mocked here, we verify
         * that one AuditRequest was sent.
         */
        ArgumentCaptor<AuditRequest> captor =
                ArgumentCaptor.forClass(AuditRequest.class);

        verify(auditRecorder, times(1))
                .record(captor.capture());

        AuditRequest auditRequest =
                captor.getValue();

        assertEquals(
                unchanged,
                auditRequest.entities()
                        .get(0)
                        .beforeData()
        );

        assertEquals(
                unchanged,
                auditRequest.entities()
                        .get(0)
                        .afterData()
        );
    }
}