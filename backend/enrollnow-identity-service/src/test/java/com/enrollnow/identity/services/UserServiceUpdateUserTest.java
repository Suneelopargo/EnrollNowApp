package com.enrollnow.identity.services;

import com.enrollnow.common.audit.AuditOperation;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.SiteRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceUpdateUserTest {

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

    @InjectMocks
    private UserService userService;

    @Test
    void updateUser_AddsChangedProfileFieldsToAuditOperation() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("John");
        user.setLastName("Smith");
        user.setTitle("Coordinator");
        user.setTimezone("UTC");

        when(userRepository.findByTenantIdAndId(
                tenantId,
                userId
        )).thenReturn(Optional.of(user));

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        when(userEmailRepository
                .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.empty());

        UpdateUserRequest request =
                new UpdateUserRequest();

        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setTitle("Manager");
        request.setTimezone("Asia/Kolkata");

        AuditOperation auditOperation =
                new AuditOperation(
                        tenantId,
                        "USER",
                        userId,
                        "USER_ACCESS_UPDATED",
                        "User access updated",
                        "API"
                );

        userService.updateUser(
                tenantId,
                userId,
                request,
                auditOperation
        );

        assertEquals(
                3,
                auditOperation.getChanges().size()
        );

        assertEquals(
                "firstName",
                auditOperation.getChanges().get(0).fieldName()
        );

        assertEquals(
                "John",
                auditOperation.getChanges().get(0).previousValue()
        );

        assertEquals(
                "Jane",
                auditOperation.getChanges().get(0).newValue()
        );

        assertEquals(
                "title",
                auditOperation.getChanges().get(1).fieldName()
        );

        assertEquals(
                "Coordinator",
                auditOperation.getChanges().get(1).previousValue()
        );

        assertEquals(
                "Manager",
                auditOperation.getChanges().get(1).newValue()
        );

        assertEquals(
                "timezone",
                auditOperation.getChanges().get(2).fieldName()
        );

        assertEquals(
                "UTC",
                auditOperation.getChanges().get(2).previousValue()
        );

        assertEquals(
                "Asia/Kolkata",
                auditOperation.getChanges().get(2).newValue()
        );

        verify(auditRecorder, never()).record(any());
    }
}