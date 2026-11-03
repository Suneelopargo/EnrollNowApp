package com.enrollnow.identity.services;

import com.enrollnow.common.audit.AuditEventCommand;

import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.dtos.UserSummaryResponse;
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
    void updateUser_UpdatesChangedProfileFields() {

        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("John");
        user.setLastName("Smith");
        user.setTitle("Coordinator");
        user.setTimezone("UTC");
        user.setStatus("ACTIVE");

        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setTitle("Manager");
        request.setTimezone("Asia/Kolkata");

        when(userRepository.findByTenantIdAndId(tenantId, userId))
                .thenReturn(Optional.of(user));

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserSummaryResponse response =
                userService.updateUser(
                        tenantId,
                        userId,
                        request
                );

        assertEquals("Jane", user.getFirstName());
        assertEquals("Smith", user.getLastName());
        assertEquals("Manager", user.getTitle());
        assertEquals("Asia/Kolkata", user.getTimezone());

        verify(userRepository).save(user);

        assertEquals("Jane", response.getFirstName());
        assertEquals("Smith", response.getLastName());
        assertEquals("Manager", response.getTitle());

        verify(auditRecorder, never())
                .record(any(AuditEventCommand.class));
    }
}