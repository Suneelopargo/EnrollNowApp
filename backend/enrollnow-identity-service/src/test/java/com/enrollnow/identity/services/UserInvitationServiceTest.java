package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.ActivateAccountRequest;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserActionToken;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.UserActionTokenRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserInvitationServiceTest {

    @Mock
    private UserActionTokenRepository userActionTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserEmailRepository userEmailRepository;

    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;

    @Mock
    private InvitationEmailService invitationEmailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserInvitationService userInvitationService;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void activateAccount_shouldRejectPasswordMismatch() {

        ActivateAccountRequest request =
                new ActivateAccountRequest();

        request.setToken("sample-token");
        request.setPassword("Password@123");
        request.setConfirmPassword("Different@123");

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userInvitationService.activateAccount(
                                tenantId,
                                request
                        )
                );

        assertEquals(
                "Password and confirmation do not match",
                ex.getMessage()
        );

        verifyNoInteractions(
                userActionTokenRepository,
                userRepository,
                userSecurityStateRepository,
                passwordEncoder
        );
    }
    
    @Test
    void activateAccount_shouldActivateUserSuccessfully() {

        String rawToken = "valid-token";
        String encodedPassword = "$argon2id$encoded-password";

        ActivateAccountRequest request = new ActivateAccountRequest();
        request.setToken(rawToken);
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");

        UserActionToken token = new UserActionToken();
        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("ENROLLMENT");
        token.setExpiresAt(OffsetDateTime.now().plusDays(1));
        token.setUsedAt(null);

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("ACTIVE");

        UserSecurityState securityState =
                new UserSecurityState();

        securityState.setTenantId(tenantId);
        securityState.setUserId(userId);
        securityState.setFailedLoginAttempts(3);
        securityState.setLockedAt(OffsetDateTime.now());
        securityState.setLockReason("TEST");

        /*
         * We do not know the SHA-256 value directly here because
         * hashToken() is internal to the service.
         *
         * Therefore allow the repository lookup for any hash String.
         */
        when(userActionTokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        when(userRepository.findByTenantIdAndId(
                tenantId,
                userId
        )).thenReturn(Optional.of(user));

        when(passwordEncoder.encode("Password@123"))
                .thenReturn(encodedPassword);

        when(userSecurityStateRepository
                .findByTenantIdAndUserId(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.of(securityState));

        userInvitationService.activateAccount(
                tenantId,
                request
        );

        assertEquals(
                encodedPassword,
                user.getPasswordHash()
        );

        assertEquals(
                "ACTIVE",
                user.getStatus()
        );

        assertEquals(
                0,
                securityState.getFailedLoginAttempts()
        );

        assertNull(
                securityState.getLockedAt()
        );

        assertNull(
                securityState.getLockReason()
        );

        assertNotNull(
                securityState.getLastPasswordResetAt()
        );

        assertNotNull(
                token.getUsedAt()
        );

        verify(passwordEncoder)
                .encode("Password@123");

        verify(userRepository)
                .save(user);

        verify(userSecurityStateRepository)
                .save(securityState);

        verify(userActionTokenRepository)
                .save(token);
    }
    
    @Test
    void activateAccount_shouldRejectAlreadyUsedToken() {

        ActivateAccountRequest request =
                new ActivateAccountRequest();

        request.setToken("used-token");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");

        UserActionToken token =
                new UserActionToken();

        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("ENROLLMENT");
        token.setExpiresAt(
                OffsetDateTime.now().plusDays(1)
        );
        token.setUsedAt(
                OffsetDateTime.now().minusMinutes(5)
        );

        when(userActionTokenRepository
                .findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService
                                        .activateAccount(
                                                tenantId,
                                                request
                                        )
                );

        assertEquals(
                "Already enrolled! Please login",
                ex.getMessage()
        );

        verify(passwordEncoder, never())
                .encode(anyString());

        verify(userRepository, never())
                .save(any());

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void activateAccount_shouldRejectExpiredToken() {

        ActivateAccountRequest request =
                new ActivateAccountRequest();

        request.setToken("expired-token");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");

        UserActionToken token =
                new UserActionToken();

        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("ENROLLMENT");

        token.setExpiresAt(
                OffsetDateTime.now().minusMinutes(1)
        );

        token.setUsedAt(null);

        when(userActionTokenRepository
                .findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService
                                        .activateAccount(
                                                tenantId,
                                                request
                                        )
                );

        assertEquals(
                "Enrollment Token Expired. Please Contact Your Site Admin To Have The Link Sent Resent",
                ex.getMessage()
        );

        verify(passwordEncoder, never())
                .encode(anyString());

        verify(userRepository, never())
                .save(any());

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void activateAccount_shouldRejectTokenFromDifferentTenant() {

        ActivateAccountRequest request =
                new ActivateAccountRequest();

        request.setToken("valid-token");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");

        UUID anotherTenantId = UUID.randomUUID();

        UserActionToken token =
                new UserActionToken();

        token.setTenantId(anotherTenantId);
        token.setUserId(userId);
        token.setTokenType("ENROLLMENT");
        token.setExpiresAt(
                OffsetDateTime.now().plusDays(1)
        );
        token.setUsedAt(null);

        when(userActionTokenRepository
                .findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService
                                        .activateAccount(
                                                tenantId,
                                                request
                                        )
                );

        assertEquals(
                "Invalid or expired activation token",
                ex.getMessage()
        );

        verify(passwordEncoder, never())
                .encode(anyString());

        verify(userRepository, never())
                .save(any());

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void activateAccount_shouldRejectInvalidTokenType() {

        ActivateAccountRequest request =
                new ActivateAccountRequest();

        request.setToken("reset-token");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");

        UserActionToken token =
                new UserActionToken();

        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("PASSWORD_RESET");
        token.setExpiresAt(
                OffsetDateTime.now().plusDays(1)
        );
        token.setUsedAt(null);

        when(userActionTokenRepository
                .findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService
                                        .activateAccount(
                                                tenantId,
                                                request
                                        )
                );

        assertEquals(
                "Invalid or expired activation token",
                ex.getMessage()
        );

        verify(passwordEncoder, never())
                .encode(anyString());

        verify(userRepository, never())
                .save(any());

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void activateAccount_shouldRejectInvalidToken() {

        ActivateAccountRequest request =
                new ActivateAccountRequest();

        request.setToken("does-not-exist");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");

        when(userActionTokenRepository
                .findByTokenHash(anyString()))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService
                                        .activateAccount(
                                                tenantId,
                                                request
                                        )
                );

        assertEquals(
                "Invalid or expired activation token",
                ex.getMessage()
        );

        verify(passwordEncoder, never())
                .encode(anyString());

        verify(userRepository, never())
                .save(any());

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void activateAccount_shouldRejectWhenUserNotFound() {

        ActivateAccountRequest request =
                new ActivateAccountRequest();

        request.setToken("valid-token");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");

        UserActionToken token =
                new UserActionToken();

        token.setTenantId(tenantId);
        token.setUserId(userId);
        token.setTokenType("ENROLLMENT");
        token.setExpiresAt(
                OffsetDateTime.now().plusDays(1)
        );
        token.setUsedAt(null);

        when(userActionTokenRepository
                .findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        when(userRepository
                .findByTenantIdAndId(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService
                                        .activateAccount(
                                                tenantId,
                                                request
                                        )
                );

        assertEquals(
                "User not found",
                ex.getMessage()
        );

        verify(passwordEncoder, never())
                .encode(anyString());

        verify(userRepository, never())
                .save(any());

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void sendInvitation_shouldSendToPrimaryEmail() {

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Sriram");
        user.setLastName("Test");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("sriram.chavali@solventek.com");
        userEmail.setPrimaryEmail(true);

        when(userRepository.findByTenantIdAndId(
                tenantId,
                userId
        )).thenReturn(Optional.of(user));

        when(userEmailRepository
                .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.of(userEmail));

        /*
         * createActivationToken() will save a new token.
         * Return the entity passed to save().
         */
        when(userActionTokenRepository.save(any(UserActionToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        userInvitationService.sendInvitation(
                tenantId,
                userId
        );

        verify(invitationEmailService).sendInvitation(
                eq("sriram.chavali@solventek.com"),
                eq("Sriram Test"),
                eq(tenantId.toString()),
                anyString()
        );

        verify(userRepository)
                .findByTenantIdAndId(
                        tenantId,
                        userId
                );

        verify(userEmailRepository)
                .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                        tenantId,
                        userId
                );

        verify(userActionTokenRepository)
                .save(any(UserActionToken.class));
    }
    
    @Test
    void sendInvitation_shouldRejectWhenUserNotFound() {

        when(userRepository.findByTenantIdAndId(
                tenantId,
                userId
        )).thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService.sendInvitation(
                                        tenantId,
                                        userId
                                )
                );

        assertEquals(
                "User not found",
                ex.getMessage()
        );

        verify(userEmailRepository, never())
                .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                        any(),
                        any()
                );

        verifyNoInteractions(
                invitationEmailService
        );

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void sendInvitation_shouldRejectWhenPrimaryEmailNotFound() {

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Sriram");
        user.setLastName("Test");

        when(userRepository.findByTenantIdAndId(
                tenantId,
                userId
        )).thenReturn(Optional.of(user));

        when(userEmailRepository
                .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userInvitationService.sendInvitation(
                                        tenantId,
                                        userId
                                )
                );

        assertEquals(
                "Primary email not found",
                ex.getMessage()
        );

        verifyNoInteractions(
                invitationEmailService
        );

        verify(userActionTokenRepository, never())
                .save(any());
    }
    
    @Test
    void sendInvitation_shouldInvalidatePreviousUnusedInvitationToken() {

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Sriram");
        user.setLastName("Test");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("sriram.chavali@solventek.com");
        userEmail.setPrimaryEmail(true);

        UserActionToken oldToken = new UserActionToken();
        oldToken.setTenantId(tenantId);
        oldToken.setUserId(userId);
        oldToken.setTokenType("ENROLLMENT");
        oldToken.setExpiresAt(
                OffsetDateTime.now().plusDays(10)
        );
        oldToken.setUsedAt(null);

        when(userRepository.findByTenantIdAndId(
                tenantId,
                userId
        )).thenReturn(Optional.of(user));

        when(userEmailRepository
                .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.of(userEmail));

        when(userActionTokenRepository
                .findByTenantIdAndUserIdAndTokenTypeAndUsedAtIsNull(
                        tenantId,
                        userId,
                        "ENROLLMENT"
                ))
                .thenReturn(java.util.List.of(oldToken));

        when(userActionTokenRepository.save(any(UserActionToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        userInvitationService.sendInvitation(
                tenantId,
                userId
        );

        assertNotNull(
                oldToken.getUsedAt()
        );

        verify(userActionTokenRepository)
                .save(oldToken);

        verify(invitationEmailService)
                .sendInvitation(
                        eq("sriram.chavali@solventek.com"),
                        eq("Sriram Test"),
                        eq(tenantId.toString()),
                        anyString()
                );
    }
    
    @Test
    void sendInvitation_shouldFailIfEmailSendingFails() {

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Sriram");
        user.setLastName("Test");

        UserEmail userEmail = new UserEmail();
        userEmail.setTenantId(tenantId);
        userEmail.setUserId(userId);
        userEmail.setEmail("sriram.chavali@solventek.com");
        userEmail.setPrimaryEmail(true);

        when(userRepository.findByTenantIdAndId(
                tenantId,
                userId
        )).thenReturn(Optional.of(user));

        when(userEmailRepository
                .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                        tenantId,
                        userId
                ))
                .thenReturn(Optional.of(userEmail));

        when(userActionTokenRepository.save(any(UserActionToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        doThrow(new RuntimeException("Graph email failed"))
                .when(invitationEmailService)
                .sendInvitation(
                        eq("sriram.chavali@solventek.com"),
                        eq("Sriram Test"),
                        eq(tenantId.toString()),
                        anyString()
                );

        RuntimeException ex =
                assertThrows(
                        RuntimeException.class,
                        () ->
                                userInvitationService.sendInvitation(
                                        tenantId,
                                        userId
                                )
                );

        assertEquals(
                "Graph email failed",
                ex.getMessage()
        );

        verify(invitationEmailService)
                .sendInvitation(
                        eq("sriram.chavali@solventek.com"),
                        eq("Sriram Test"),
                        eq(tenantId.toString()),
                        anyString()
                );
    }
}