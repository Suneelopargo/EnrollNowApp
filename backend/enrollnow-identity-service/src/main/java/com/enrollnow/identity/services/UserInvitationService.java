package com.enrollnow.identity.services;

import com.enrollnow.identity.models.UserActionToken;
import com.enrollnow.identity.dtos.ActivateAccountRequest;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import com.enrollnow.identity.repositories.UserActionTokenRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class UserInvitationService {

    /*
     * Existing V2 database constraint currently calls this ENROLLMENT.
     * In application terminology this means STAFF ACCOUNT ACTIVATION,
     * not participant study enrollment.
     */
    private static final String TOKEN_TYPE = "ENROLLMENT";

    private static final int TOKEN_EXPIRY_DAYS = 14;

    private final UserActionTokenRepository userActionTokenRepository;
    
    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final InvitationEmailService invitationEmailService;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final PasswordEncoder passwordEncoder;

    public UserInvitationService(
            UserActionTokenRepository userActionTokenRepository,
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            InvitationEmailService invitationEmailService, 
            UserSecurityStateRepository userSecurityStateRepository, 
            PasswordEncoder passwordEncoder) {

        this.userActionTokenRepository = userActionTokenRepository;
        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.invitationEmailService = invitationEmailService;
		this.userSecurityStateRepository = userSecurityStateRepository;
		this.passwordEncoder = passwordEncoder;
		
    }
    @Transactional
    public String createActivationToken(
            UUID tenantId,
            UUID userId) {

        OffsetDateTime now = OffsetDateTime.now();

        /*
         * Invalidate previous unused activation tokens
         * for the same staff user.
         */
        List<UserActionToken> existingTokens =
                userActionTokenRepository
                        .findByTenantIdAndUserIdAndTokenTypeAndUsedAtIsNull(
                                tenantId,
                                userId,
                                TOKEN_TYPE
                        );

        for (UserActionToken token : existingTokens) {
            token.setUsedAt(now);
            userActionTokenRepository.save(token);
        }

        String rawToken = generateToken();

        UserActionToken activationToken =
                new UserActionToken();

        activationToken.setTenantId(tenantId);
        activationToken.setUserId(userId);
        activationToken.setTokenType(TOKEN_TYPE);
        activationToken.setTokenHash(
                hashToken(rawToken)
        );
        activationToken.setExpiresAt(
                now.plusDays(TOKEN_EXPIRY_DAYS)
        );

        userActionTokenRepository.save(
                activationToken
        );

        /*
         * Temporary development behavior.
         * Later this raw token will be emailed
         * to the newly created staff member.
         */
        return rawToken;
    }

    private String generateToken() {

        byte[] randomBytes = new byte[32];

        new SecureRandom().nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    private String hashToken(String token) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            token.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            return HexFormat.of()
                    .formatHex(hash);

        } catch (NoSuchAlgorithmException ex) {

            throw new IllegalStateException(
                    "SHA-256 is not available",
                    ex
            );
        }
    }
    
    @Transactional
    public void sendInvitation(
            UUID tenantId,
            UUID userId) {

        User user =
                userRepository
                        .findByTenantIdAndId(
                                tenantId,
                                userId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found"
                                )
                        );

        UserEmail userEmail =
                userEmailRepository
                        .findByTenantIdAndUserIdAndPrimaryEmailTrue(
                                tenantId,
                                userId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Primary email not found"
                                )
                        );

        /*
         * Your existing method:
         * generates raw token,
         * stores only SHA-256 hash,
         * expires in 14 days.
         */
        String rawToken =
                createActivationToken(
                        tenantId,
                        userId
                );

        String recipientName =
                user.getFirstName() + " " + user.getLastName();

        invitationEmailService.sendInvitation(
                userEmail.getEmail(),
                recipientName,
                tenantId.toString(),
                rawToken
        );
    }
    
    @Transactional
    public void activateAccount(
            UUID tenantId,
            ActivateAccountRequest request) {

        OffsetDateTime now = OffsetDateTime.now();

        if (!request.getPassword().equals(
                request.getConfirmPassword())) {

            throw new IllegalArgumentException(
                    "Password and confirmation do not match"
            );
        }

        String tokenHash =
                hashToken(request.getToken());

        UserActionToken activationToken =
                userActionTokenRepository
                        .findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid or expired activation token"
                                )
                        );

        if (!activationToken.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "Invalid or expired activation token"
            );
        }

        if (!TOKEN_TYPE.equals(
                activationToken.getTokenType())) {

            throw new IllegalArgumentException(
                    "Invalid or expired activation token"
            );
        }

        if (activationToken.getUsedAt() != null) {
            throw new IllegalArgumentException(
                    "Activation token has already been used"
            );
        }

        if (activationToken.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException(
                    "Activation token has expired"
            );
        }

        User user =
                userRepository
                        .findByTenantIdAndId(
                                tenantId,
                                activationToken.getUserId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found"
                                )
                        );

        String encodedPassword =
                passwordEncoder.encode(
                        request.getPassword()
                );

        user.setPasswordHash(encodedPassword);

        /*
         * First-time account activation.
         * Keep ACTIVE users active.
         *
         * We should NOT reactivate a user who was
         * deliberately disabled by an administrator.
         */
        if (!"DISABLED".equalsIgnoreCase(
                user.getStatus())) {

            user.setStatus("ACTIVE");
        }

        userRepository.save(user);

        userSecurityStateRepository
                .findByTenantIdAndUserId(
                        tenantId,
                        user.getId()
                )
                .ifPresent(securityState -> {

                    securityState.setFailedLoginAttempts(0);
                    securityState.setLockedAt(null);
                    securityState.setLockReason(null);
                    securityState.setLastPasswordResetAt(now);

                    userSecurityStateRepository.save(
                            securityState
                    );
                });

        activationToken.setUsedAt(now);

        userActionTokenRepository.save(
                activationToken
        );
    }
}