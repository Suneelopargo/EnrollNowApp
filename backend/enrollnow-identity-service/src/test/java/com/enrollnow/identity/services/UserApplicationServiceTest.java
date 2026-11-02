package com.enrollnow.identity.services;


import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditRequest;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.dtos.UserSummaryResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class UserApplicationServiceTest {
	
	private UserService userService;
	private AuditRecorder auditRecorder;
	private UserApplicationService service;
	
	@BeforeEach
	void setUp() {

	    userService = mock(UserService.class);
	    auditRecorder = mock(AuditRecorder.class);

	    service = new UserApplicationService(
	            userService,
	            auditRecorder
	    );
	}
	
	@Test
	void updateUser_CapturesBeforeAndAfterAndSendsAuditRequest() {

	    UUID tenantId = UUID.randomUUID();
	    UUID userId = UUID.randomUUID();

	 	    UpdateUserRequest request =
	            new UpdateUserRequest();

	    request.setFirstName("Jane");
	    request.setLastName("Smith");
	    request.setTitle("Manager");
	    request.setTimezone("Asia/Kolkata");

	    Map<String, Object> before = Map.of(
	            "firstName", "John",
	            "lastName", "Smith",
	            "title", "Coordinator",
	            "timezone", "UTC"
	    );

	    Map<String, Object> after = Map.of(
	            "firstName", "Jane",
	            "lastName", "Smith",
	            "title", "Manager",
	            "timezone", "Asia/Kolkata"
	    );

	    when(userService.getUserAuditSnapshot(
	            tenantId,
	            userId
	    )).thenReturn(
	            before,
	            after
	    );

	    UserSummaryResponse response =
	            new UserSummaryResponse(
	                    userId,
	                    "Jane",
	                    "Smith",
	                    "Manager",
	                    "ACTIVE",
	                    "jane@example.com"
	            );

	    when(userService.updateUser(
	            tenantId,
	            userId,
	            request
	    )).thenReturn(response);

	    UserSummaryResponse result =
	            service.updateUser(
	                    tenantId,
	                    userId,
	                    request
	            );

	    assertEquals(response, result);

	    ArgumentCaptor<AuditRequest> captor =
	            ArgumentCaptor.forClass(AuditRequest.class);

	    verify(auditRecorder)
	            .record(captor.capture());

	    AuditRequest auditRequest =
	            captor.getValue();

	    assertEquals(tenantId, auditRequest.tenantId());
	    assertEquals("USER", auditRequest.entityType());
	    assertEquals(userId, auditRequest.entityId());
	    assertEquals("USER_UPDATED", auditRequest.action());

	    assertEquals(1, auditRequest.entities().size());

	    AuditEntitySnapshot snapshot =
	            auditRequest.entities().get(0);

	    assertEquals(before, snapshot.beforeData());
	    assertEquals(after, snapshot.afterData());
	}
	
	@Test
	void deactivateUser_RecordsAuditEvent() {

	    UUID tenantId = UUID.randomUUID();
	    UUID userId = UUID.randomUUID();

	    UserSummaryResponse response = mock(UserSummaryResponse.class);

	    when(userService.deactivateUser(
	            tenantId,
	            userId
	    )).thenReturn(response);

	    when(userService.getUserAuditSnapshot(
	            tenantId,
	            userId
	    )).thenReturn(
	            Map.of("status", "ACTIVE"),
	            Map.of("status", "DISABLED")
	    );
	    UserSummaryResponse result =
	            service.deactivateUser(
	                    tenantId,
	                    userId
	            );

	    assertEquals(response, result);

	    ArgumentCaptor<AuditEventCommand> captor =
	            ArgumentCaptor.forClass(AuditEventCommand.class);

	    verify(auditRecorder).record(captor.capture());

	    AuditEventCommand command = captor.getValue();

	    assertEquals(tenantId, command.tenantId());
	    assertEquals("USER", command.entityType());
	    assertEquals(userId, command.entityId());
	    assertEquals("USER_DEACTIVATED", command.action());
	}
	
	@Test
	void activateUser_RecordsAuditEvent() {

	    UUID tenantId = UUID.randomUUID();
	    UUID userId = UUID.randomUUID();

	    UserSummaryResponse response = mock(UserSummaryResponse.class);

	    when(userService.activateUser(
	            tenantId,
	            userId
	    )).thenReturn(response);

	    when(userService.getUserAuditSnapshot(
	            tenantId,
	            userId
	    )).thenReturn(
	            Map.of("status", "DISABLED"),
	            Map.of("status", "ACTIVE")
	    );

	    UserSummaryResponse result =
	            service.activateUser(
	                    tenantId,
	                    userId
	            );

	    assertEquals(response, result);

	    ArgumentCaptor<AuditEventCommand> captor =
	            ArgumentCaptor.forClass(AuditEventCommand.class);

	    verify(auditRecorder).record(captor.capture());

	    AuditEventCommand command = captor.getValue();

	    assertEquals(tenantId, command.tenantId());
	    assertEquals("USER", command.entityType());
	    assertEquals(userId, command.entityId());
	    assertEquals("USER_ACTIVATED", command.action());
	}

}
