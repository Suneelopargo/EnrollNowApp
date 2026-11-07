package com.enrollnow.notification.services;

import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LockCheckingJobServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSecurityStateRepository securityStateRepository;
    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    private LockCheckingJobService lockCheckingJobService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        lockCheckingJobService = new LockCheckingJobService(
                userRepository,
                securityStateRepository,
                securitySettingsRepository
        );
    }

    @Test
    void testCheckLocksDaily_LocksInactiveUser() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("ACTIVE");
        user.setLastLoginAt(OffsetDateTime.now().minusDays(100)); // 100 days inactive
        when(userRepository.findAll()).thenReturn(List.of(user));

        UserSecurityState state = new UserSecurityState();
        when(securityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(state));

        SecuritySettings settings = new SecuritySettings();
        settings.setInactivityLockDays(90); // limit 90 days
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        lockCheckingJobService.checkLocksDaily();

        assertEquals("LOCKED", user.getStatus());
        assertNotNull(state.getLockedAt());
        assertEquals("INACTIVITY_TIMEOUT", state.getLockReason());
        verify(securityStateRepository, times(1)).save(state);
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testCheckLocksDaily_LocksExcessiveFailedAttempts() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("ACTIVE");
        user.setLastLoginAt(OffsetDateTime.now());
        when(userRepository.findAll()).thenReturn(List.of(user));

        UserSecurityState state = new UserSecurityState();
        state.setFailedLoginAttempts(6); // 6 failed attempts
        when(securityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(state));

        SecuritySettings settings = new SecuritySettings();
        settings.setInactivityLockDays(90);
        settings.setMaxFailedLoginAttempts(5); // limit 5
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        lockCheckingJobService.checkLocksDaily();

        assertEquals("LOCKED", user.getStatus());
        assertNotNull(state.getLockedAt());
        assertEquals("MAX_FAILED_LOGIN_ATTEMPTS", state.getLockReason());
        verify(securityStateRepository, times(1)).save(state);
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testCheckLocksDaily_AlreadyLocked_Skipped() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("LOCKED");
        when(userRepository.findAll()).thenReturn(List.of(user));

        UserSecurityState state = new UserSecurityState();
        state.setLockedAt(OffsetDateTime.now());
        when(securityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(state));

        lockCheckingJobService.checkLocksDaily();

        verify(securitySettingsRepository, never()).findByTenantId(any());
        verify(userRepository, never()).save(any());
    }
}
