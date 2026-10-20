package com.enrollnow.identity.services;

import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.UserPasswordHistory;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserPasswordHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordPolicyValidatorTest {

    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    @Mock
    private UserPasswordHistoryRepository userPasswordHistoryRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordPolicyValidator passwordPolicyValidator;

    private UUID tenantId;
    private UUID userId;
    private SecuritySettings settings;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();

        settings = new SecuritySettings();
        settings.setTenantId(tenantId);
        settings.setMinimumPasswordLength(10);
        settings.setRequireDigit(true);
        settings.setRequireSymbol(true);
        settings.setRequireMixedCase(true);
        settings.setPasswordHistoryCount(4);
        settings.setMinimumPasswordStrength("MODERATE");
    }

    @Test
    void testValidatePassword_ValidPassword() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        assertDoesNotThrow(() ->
                passwordPolicyValidator.validatePassword(tenantId, userId, "SecurePass123!")
        );
    }

    @Test
    void testValidatePassword_TooShort() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                passwordPolicyValidator.validatePassword(tenantId, userId, "Short1!")
        );
        assertTrue(ex.getMessage().contains("at least 10 characters"));
    }

    @Test
    void testValidatePassword_MissingDigit() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                passwordPolicyValidator.validatePassword(tenantId, userId, "SecurePassNoDigit!")
        );
        assertTrue(ex.getMessage().contains("at least one digit"));
    }

    @Test
    void testValidatePassword_MissingSymbol() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                passwordPolicyValidator.validatePassword(tenantId, userId, "SecurePass1234")
        );
        assertTrue(ex.getMessage().contains("at least one symbol"));
    }

    @Test
    void testValidatePassword_MissingMixedCase() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                passwordPolicyValidator.validatePassword(tenantId, userId, "lowercase1234!")
        );
        assertTrue(ex.getMessage().contains("mixed upper and lower case"));
    }

    @Test
    void testValidatePassword_PasswordHistoryReused() {
        when(securitySettingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));

        UserPasswordHistory hist1 = new UserPasswordHistory();
        hist1.setPasswordHash("hash1");
        UserPasswordHistory hist2 = new UserPasswordHistory();
        hist2.setPasswordHash("hash2");

        when(userPasswordHistoryRepository.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId))
                .thenReturn(List.of(hist1, hist2));
        when(passwordEncoder.matches(eq("SecurePass123!"), eq("hash1"))).thenReturn(false);
        when(passwordEncoder.matches(eq("SecurePass123!"), eq("hash2"))).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                passwordPolicyValidator.validatePassword(tenantId, userId, "SecurePass123!")
        );
        assertTrue(ex.getMessage().contains("Cannot reuse any of your last 4 passwords"));
    }

    @Test
    void testRecordPasswordChange() {
        passwordPolicyValidator.recordPasswordChange(tenantId, userId, "newHashedPassword");
        verify(userPasswordHistoryRepository).save(any(UserPasswordHistory.class));
    }
}
