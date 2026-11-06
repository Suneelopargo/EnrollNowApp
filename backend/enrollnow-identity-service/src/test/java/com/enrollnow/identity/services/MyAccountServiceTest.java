package com.enrollnow.identity.services;

import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditRequest;
import com.enrollnow.identity.dtos.*;
import com.enrollnow.identity.models.*;
import com.enrollnow.identity.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MyAccountServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserEmailRepository userEmailRepository;
    @Mock
    private UserActionTokenRepository userActionTokenRepository;
    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;
    @Mock
    private SecuritySettingsRepository securitySettingsRepository;
    @Mock
    private UserLoginActivityRepository userLoginActivityRepository;
    @Mock
    private PasswordPolicyValidator passwordPolicyValidator;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private InvitationEmailService invitationEmailService;
    @Mock
    private AuditRecorder auditRecorder;
    @Mock
    private StudyAccessResolver studyAccessResolver;

    private MyAccountService myAccountService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() throws Exception {
        myAccountService = new MyAccountService(
                userRepository,
                userEmailRepository,
                userActionTokenRepository,
                userSecurityStateRepository,
                securitySettingsRepository,
                userLoginActivityRepository,
                passwordPolicyValidator,
                passwordEncoder,
                invitationEmailService,
                auditRecorder,
                studyAccessResolver
        );
        Path tempDir = Files.createTempDirectory("account-test-uploads");
        myAccountService.setUploadDir(tempDir.toString());
        myAccountService.setEnvironment("development");
    }

    @Test
    void getProfile_returnsProfile() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Alice");
        user.setLastName("Smith");
        user.setTitle("Dr.");
        user.setPhoneNumber("+1234567890");
        user.setTimezone("America/New_York");
        user.setIgnoreTimezoneMismatch(false);
        user.setCreatedAt(OffsetDateTime.now());

        UserEmail userEmail = new UserEmail();
        userEmail.setUserId(userId);
        userEmail.setTenantId(tenantId);
        userEmail.setEmail("alice@example.com");
        userEmail.setPrimaryEmail(true);
        userEmail.setVerified(true);

        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, userId)).thenReturn(Optional.of(userEmail));

        UserProfileResponse response = myAccountService.getProfile(tenantId, userId);

        assertNotNull(response);
        assertEquals("alice@example.com", response.getEmail());
        assertEquals("Alice", response.getFirstName());
        assertEquals("Smith", response.getLastName());
        assertEquals("Dr.", response.getTitle());
        assertEquals("+1234567890", response.getPhoneNumber());
        assertEquals("America/New_York", response.getTimezone());
        assertTrue(response.isEmailVerified());
    }

    @Test
    void updateUserProfile_persistsAndAudits() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Old");
        user.setLastName("Name");

        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserEmail userEmail = new UserEmail();
        userEmail.setUserId(userId);
        userEmail.setTenantId(tenantId);
        userEmail.setEmail("user@example.com");
        userEmail.setPrimaryEmail(true);
        userEmail.setVerified(true);
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, userId)).thenReturn(Optional.of(userEmail));

        UpdateUserProfileRequest req = new UpdateUserProfileRequest();
        req.setFirstName("New");
        req.setLastName("Updated");
        req.setTitle("Prof.");
        req.setPhoneNumber("555-1234");
        req.setTimezone("Europe/London");
        req.setIgnoreTimezoneMismatch(true);

        UserProfileResponse response = myAccountService.updateProfile(tenantId, userId, req);

        assertNotNull(response);
        assertEquals("New", response.getFirstName());
        assertEquals("Updated", response.getLastName());
        assertEquals("Prof.", response.getTitle());
        assertEquals("555-1234", response.getPhoneNumber());
        assertEquals("Europe/London", response.getTimezone());
        assertTrue(response.isIgnoreTimezoneMismatch());
        verify(auditRecorder, atLeastOnce()).record(any(AuditRequest.class));
    }

    @Test
    void updateUserProfile_partialUpdateOnlyTimezone_preservesExistingNamesAndAudits() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Suneel");
        user.setLastName("Kumar");
        user.setTimezone("America/New_York");

        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserEmail userEmail = new UserEmail();
        userEmail.setUserId(userId);
        userEmail.setTenantId(tenantId);
        userEmail.setEmail("suneel@example.com");
        userEmail.setPrimaryEmail(true);
        userEmail.setVerified(true);
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, userId)).thenReturn(Optional.of(userEmail));

        // Partial update: only timezone specified, no firstName or lastName provided
        UpdateUserProfileRequest req = new UpdateUserProfileRequest();
        req.setTimezone("Asia/Kolkata");

        UserProfileResponse response = myAccountService.updateProfile(tenantId, userId, req);

        assertNotNull(response);
        assertEquals("Suneel", response.getFirstName());
        assertEquals("Kumar", response.getLastName());
        assertEquals("Asia/Kolkata", response.getTimezone());
        verify(auditRecorder, atLeastOnce()).record(any(AuditRequest.class));
    }

    @Test
    void changePassword_success() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setPasswordHash("hashed-old-password");

        UserSecurityState securityState = new UserSecurityState();
        securityState.setUserId(userId);
        securityState.setTenantId(tenantId);

        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(securityState));
        when(passwordEncoder.matches("OldPass123!", "hashed-old-password")).thenReturn(true);
        when(passwordEncoder.encode("NewPass123!")).thenReturn("hashed-new-password");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("OldPass123!");
        request.setNewPassword("NewPass123!");
        request.setConfirmPassword("NewPass123!");

        myAccountService.changePassword(tenantId, userId, request);

        assertEquals("hashed-new-password", user.getPasswordHash());
        verify(userRepository).save(user);
        verify(auditRecorder, atLeastOnce()).record(any(AuditRequest.class));
    }

    @Test
    void changePassword_wrongCurrentPasswordThrows() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setPasswordHash("hashed-old-password");

        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass123!", "hashed-old-password")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("WrongPass123!");
        request.setNewPassword("NewPass123!");
        request.setConfirmPassword("NewPass123!");

        assertThrows(IllegalArgumentException.class, () ->
                myAccountService.changePassword(tenantId, userId, request)
        );
    }

    @Test
    void getRecentLogins_returnsActivities() {
        UserLoginActivity activity = new UserLoginActivity();
        activity.setId(UUID.randomUUID());
        activity.setTenantId(tenantId);
        activity.setUserId(userId);
        activity.setIpAddress("192.168.1.1");
        activity.setUserAgent("Mozilla/5.0");
        activity.setLoginAt(OffsetDateTime.now());

        when(userLoginActivityRepository.findTop5ByTenantIdAndUserIdOrderByLoginAtDesc(eq(tenantId), eq(userId)))
                .thenReturn(List.of(activity));

        List<RecentLoginDto> logins = myAccountService.getRecentLogins(tenantId, userId);

        assertEquals(1, logins.size());
        assertEquals("192.168.1.1", logins.get(0).getIpAddress());
        assertEquals("Mozilla/5.0", logins.get(0).getUserAgent());
    }

    @Test
    void updateProfilePhoto_rejectsNonImage() {
        byte[] plainTextBytes = "hello text file".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", plainTextBytes);

        assertThrows(IllegalArgumentException.class, () ->
                myAccountService.updateProfilePhoto(tenantId, userId, file)
        );
    }

    @Test
    void updateProfilePhoto_acceptsJpeg() throws Exception {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        // JPEG magic bytes: FF D8 FF
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46};
        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", jpegBytes);

        String photoUrl = myAccountService.updateProfilePhoto(tenantId, userId, file);

        assertNotNull(photoUrl);
        assertTrue(photoUrl.startsWith("data:image/jpeg;base64,"));
        assertEquals(photoUrl, user.getProfilePhotoUrl());
        verify(userRepository).save(user);
    }

    @Test
    void sendDailyDigestNow_requiresDevOrStaging() {
        myAccountService.setEnvironment("production");

        assertThrows(AccessDeniedException.class, () ->
                myAccountService.sendDailyDigestNow(tenantId, userId)
        );
    }

    @Test
    void sendDailyDigestNow_succeedsInDev() {
        myAccountService.setEnvironment("development");

        assertDoesNotThrow(() ->
                myAccountService.sendDailyDigestNow(tenantId, userId)
        );
    }
}
