package com.enrollnow.identity.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.dtos.CreateUserRequest;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

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

        ArgumentCaptor<AuditEventCommand> auditCaptor =
                ArgumentCaptor.forClass(AuditEventCommand.class);

        verify(auditRecorder).record(auditCaptor.capture());

        AuditEventCommand command = auditCaptor.getValue();

        assertEquals(tenantId, command.tenantId());
        assertEquals("USER", command.entityType());
        assertEquals(userId, command.entityId());
        assertEquals("USER_CREATED", command.action());
        assertEquals("API", command.source());

        assertEquals(
                "john.smith@example.com",
                command.afterData().get("email")
        );

        assertEquals(
                "ACTIVE",
                command.afterData().get("status")
        );
    }
}