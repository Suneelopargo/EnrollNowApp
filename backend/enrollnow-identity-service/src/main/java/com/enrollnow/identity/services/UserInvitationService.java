package com.enrollnow.identity.services;

import com.enrollnow.identity.exceptions.AlreadyEnrolledException;
import com.enrollnow.identity.models.UserActionToken;
import com.enrollnow.identity.dtos.ActivateAccountRequest;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.UserActionTokenRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * Existing V2 database constraint calls this ENROLLMENT.
     * In application terminology this means STAFF ACCOUNT ACTIVATION.
     */
    private static final String TOKEN_TYPE = "ENROLLMENT";
    private static final int TOKEN_EXPIRY_DAYS = 14;

    private final UserActionTokenRepository userActionTokenRepository;
    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final InvitationEmailService invitationEmailService;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final PasswordEncoder passwordEncoder;
    private PasswordPolicyValidator passwordPolicyValidator;

    @Autowired(required = false)
    public void setPasswordPolicyValidator(PasswordPolicyValidator passwordPolicyValidator) {
        this.passwordPolicyValidator = passwordPolicyValidator;
    }

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
            throw new AlreadyEnrolledException(
                    "Already enrolled! Please login"
            );
        }

        if (activationToken.getExpiresAt().isBefore(now)) {
            throw new AlreadyEnrolledException(
                    "TOKEN_EXPIRED",
                    "Enrollment Token Expired. Please Contact Your Site Admin To Have The Link Sent Resent"
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

        if (passwordPolicyValidator != null) {
            passwordPolicyValidator.validatePassword(tenantId, user.getId(), request.getPassword());
        } else {
            validatePasswordPolicy(request.getPassword());
        }

        String encodedPassword =
                passwordEncoder.encode(
                        request.getPassword()
                );

        user.setPasswordHash(encodedPassword);

        /*
         * First-time account activation.
         * Keep ACTIVE users active.
         * Do NOT reactivate a user who was deliberately disabled.
         */
        if (!"DISABLED".equalsIgnoreCase(
                user.getStatus())) {

            user.setStatus("ACTIVE");
        }

        userRepository.save(user);

        if (passwordPolicyValidator != null) {
            passwordPolicyValidator.recordPasswordChange(tenantId, user.getId(), encodedPassword);
        }

        userSecurityStateRepository
                .findByTenantIdAndUserId(
                        tenantId,
                        user.getId()
                )
                .ifPresent(securityState -> {
                    securityState.setPasswordResetRequired(false);
                    securityState.setFailedLoginAttempts(0);
                    securityState.setLockedAt(null);
                    securityState.setLockReason(null);
                    securityState.setLastPasswordResetAt(now);

                    userSecurityStateRepository.save(securityState);
                });

        activationToken.setUsedAt(now);

        userActionTokenRepository.save(
                activationToken
        );
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 10) {
            throw new IllegalArgumentException("Password must be at least 10 characters long");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Password must contain at least one digit");
        }
        if (!password.matches(".*[^0-9A-Za-z].*")) {
            throw new IllegalArgumentException("Password must contain at least one special character");
        }
        if (!password.matches(".*[a-z].*") || !password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain mixed upper and lower case characters");
        }
    }

    @Transactional(readOnly = true)
    public void validateActivationToken(
            UUID tenantId,
            String token) {

        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Activation token is required"
            );
        }

        OffsetDateTime now = OffsetDateTime.now();

        String tokenHash = hashToken(token.trim());

        UserActionToken activationToken =
                userActionTokenRepository
                        .findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid or expired activation token"
                                )
                        );

        if (tenantId != null && !activationToken.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "Invalid or expired activation token"
            );
        }

        if (!TOKEN_TYPE.equals(activationToken.getTokenType())) {
            throw new IllegalArgumentException(
                    "Invalid or expired activation token"
            );
        }

        if (activationToken.getUsedAt() != null) {
            throw new AlreadyEnrolledException(
                    "Already enrolled! Please login"
            );
        }

        if (activationToken.getExpiresAt().isBefore(now)) {
            throw new AlreadyEnrolledException(
                    "TOKEN_EXPIRED",
                    "Enrollment Token Expired. Please Contact Your Site Admin To Have The Link Sent Resent"
            );
        }
    }
}
