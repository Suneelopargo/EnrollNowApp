package com.enrollnow.identity.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditRequest;
import com.enrollnow.identity.dtos.CreateUserRequest;
import com.enrollnow.identity.dtos.UserSummaryResponse;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.*;

class UserServiceCreateUserAuditTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserEmailRepository userEmailRepository;

    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private SitePermissionService sitePermissionService;

    @Mock
    private AuditRecorder auditRecorder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        userService = new UserService(
                userRepository,
                userEmailRepository,
                userSecurityStateRepository,
                roleRepository,
                userRoleAssignmentRepository,
                siteRepository,
                sitePermissionService,
                auditRecorder
        );
    }

    @Test
    void shouldAuditUserCreation() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        CreateUserRequest request = new CreateUserRequest();
        request.setFirstName("John");
        request.setLastName("Smith");
        request.setTitle("Research Coordinator");
        request.setTimezone("America/New_York");
        request.setEmail("John.Smith@example.com");

        when(userEmailRepository.existsByTenantIdAndEmailIgnoreCase(
                tenantId,
                "john.smith@example.com"
        )).thenReturn(false);

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);
                    user.setId(userId);
                    return user;
                });

        userService.createUser(tenantId, request);

       
    }
    
    @Test
    void createUser_CapturesPersistedStateAndSendsAuditRequest() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        UserService userService = mock(UserService.class);
        AuditRecorder auditRecorder = mock(AuditRecorder.class);

        UserApplicationService service =
                new UserApplicationService(
                        userService,
                        auditRecorder
                );

        CreateUserRequest request =
                new CreateUserRequest();

        request.setFirstName("Test");
        request.setLastName("User");
        request.setTitle("Study Coordinator");
        request.setTimezone("Asia/Kolkata");
        request.setEmail("test.user@example.com");

        UserSummaryResponse response =
                new UserSummaryResponse(
                        userId,
                        "Test",
                        "User",
                        "Study Coordinator",
                        "ACTIVE",
                        "test.user@example.com"
                );

        when(userService.createUser(
                tenantId,
                request
        )).thenReturn(response);

        Map<String, Object> after = Map.of(
                "firstName", "Test",
                "lastName", "User",
                "title", "Study Coordinator",
                "timezone", "Asia/Kolkata",
                "status", "ACTIVE",
                "email", "test.user@example.com"
        );

        when(userService.getUserAuditSnapshot(
                tenantId,
                userId
        )).thenReturn(after);

        UserSummaryResponse result =
                service.createUser(
                        tenantId,
                        request
                );

        assertEquals(response, result);

        ArgumentCaptor<AuditRequest> captor =
                ArgumentCaptor.forClass(AuditRequest.class);

        verify(auditRecorder).record(captor.capture());

        AuditRequest auditRequest =
                captor.getValue();

        assertEquals("USER_CREATED", auditRequest.action());
        assertEquals("USER", auditRequest.entityType());
        assertEquals(userId, auditRequest.entityId());
        assertEquals(1, auditRequest.entities().size());

        AuditEntitySnapshot snapshot =
                auditRequest.entities().get(0);

        assertNull(snapshot.beforeData());
        assertEquals(after, snapshot.afterData());
    }
}