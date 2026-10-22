package com.enrollnow.identity.services;

import com.enrollnow.common.security.SecurityTokenHelper;
import com.enrollnow.identity.exceptions.AlreadyEnrolledException;
import com.enrollnow.identity.dtos.ForgotPasswordRequest;
import com.enrollnow.identity.models.UserActionToken;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.repositories.UserActionTokenRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;

import com.enrollnow.identity.dtos.ResetPasswordRequest;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PasswordRecoveryService {

    private static final Logger log = LoggerFactory.getLogger(PasswordRecoveryService.class);
    private static final String TOKEN_TYPE = "PASSWORD_RESET";
    private static final int TOKEN_EXPIRY_MINUTES = 30;

    private final UserEmailRepository userEmailRepository;
    private final UserActionTokenRepository userActionTokenRepository;
    private final UserRepository userRepository;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final PasswordEncoder passwordEncoder;
    private final InvitationEmailService invitationEmailService;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private UserSessionService userSessionService;

    public PasswordRecoveryService(
            UserEmailRepository userEmailRepository,
            UserActionTokenRepository userActionTokenRepository,
            UserRepository userRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            PasswordEncoder passwordEncoder,
            InvitationEmailService invitationEmailService) {
        this(
                userEmailRepository,
                userActionTokenRepository,
                userRepository,
                userSecurityStateRepository,
                passwordEncoder,
                invitationEmailService,
                null,
                null
        );
    }

    public PasswordRecoveryService(
            UserEmailRepository userEmailRepository,
            UserActionTokenRepository userActionTokenRepository,
            UserRepository userRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            PasswordEncoder passwordEncoder,
            InvitationEmailService invitationEmailService,
            PasswordPolicyValidator passwordPolicyValidator) {
        this(
                userEmailRepository,
                userActionTokenRepository,
                userRepository,
                userSecurityStateRepository,
                passwordEncoder,
                invitationEmailService,
                passwordPolicyValidator,
                null
        );
    }

    @Autowired
    public PasswordRecoveryService(
            UserEmailRepository userEmailRepository,
            UserActionTokenRepository userActionTokenRepository,
            UserRepository userRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            PasswordEncoder passwordEncoder,
            InvitationEmailService invitationEmailService,
            @Autowired(required = false) PasswordPolicyValidator passwordPolicyValidator,
            @Autowired(required = false) UserSessionService userSessionService) {

        this.userEmailRepository = userEmailRepository;
        this.userActionTokenRepository = userActionTokenRepository;
        this.userRepository = userRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
        this.passwordEncoder = passwordEncoder;
        this.invitationEmailService = invitationEmailService;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.userSessionService = userSessionService;
    }

    @Autowired(required = false)
    public void setUserSessionService(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    @Transactional
    public String requestPasswordReset(
            UUID tenantId,
            ForgotPasswordRequest request) {

        String normalizedEmail =
                request.getEmail()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        UserEmail userEmail =
                userEmailRepository
                        .findByTenantIdAndEmailIgnoreCase(
                                tenantId,
                                normalizedEmail)
                        .orElse(null);

        /*
         * Do not reveal whether the email exists.
         */
        if (userEmail == null) {
            return null;
        }

        /*
         * Invalidate any previous unused reset tokens.
         */
        List<UserActionToken> existingTokens =
                userActionTokenRepository
                        .findByTenantIdAndUserIdAndTokenTypeAndUsedAtIsNull(
                                tenantId,
                                userEmail.getUserId(),
                                TOKEN_TYPE
                        );

        OffsetDateTime now = OffsetDateTime.now();

        for (UserActionToken token : existingTokens) {
            token.setUsedAt(now);
            userActionTokenRepository.save(token);
        }

        String rawToken = SecurityTokenHelper.generateSecureToken();

        UserActionToken token = new UserActionToken();

        token.setTenantId(tenantId);
        token.setUserId(userEmail.getUserId());
        token.setTokenType(TOKEN_TYPE);
        token.setTokenHash(SecurityTokenHelper.hashToken(rawToken));
        token.setExpiresAt(
                now.plusMinutes(TOKEN_EXPIRY_MINUTES)
        );

        userActionTokenRepository.save(token);

        User user = userRepository
                .findByTenantIdAndId(tenantId, userEmail.getUserId())
                .orElse(null);

        String recipientName = (user != null && user.getFirstName() != null)
                ? (user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")).trim()
                : "EnrollNow User";

        try {
            invitationEmailService.sendPasswordReset(
                    userEmail.getEmail(),
                    recipientName,
                    tenantId.toString(),
                    rawToken
            );
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}: {}", userEmail.getEmail(), ex.getMessage(), ex);
        }

        return rawToken;
    }

    @Transactional
    public void resetPassword(
            UUID tenantId,
            ResetPasswordRequest request) {

        OffsetDateTime now = OffsetDateTime.now();

        String tokenHash = SecurityTokenHelper.hashToken(request.getToken());

        UserActionToken resetToken =
                userActionTokenRepository
                        .findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid or expired password reset token"
                                )
                        );

        if (!resetToken.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "Invalid or expired password reset token"
            );
        }

        // Handle case where an ENROLLMENT token is passed to reset password
        if ("ENROLLMENT".equals(resetToken.getTokenType())) {
            if (resetToken.getExpiresAt().isBefore(now)) {
                throw new AlreadyEnrolledException(
                        "TOKEN_EXPIRED",
                        "Enrollment Token Expired. Please Contact Your Site Admin To Have The Link Sent Resent"
                );
            }
            if (resetToken.getUsedAt() != null) {
                throw new AlreadyEnrolledException(
                        "ALREADY_ENROLLED",
                        "Already enrolled! Please login"
                );
            }
            throw new AlreadyEnrolledException(
                    "ENROLLMENT_REQUIRED",
                    "Must complete enrollment before attempting to reset password. Please contact your site admin for an enrollment link"
            );
        }

        if (!TOKEN_TYPE.equals(resetToken.getTokenType())) {
            throw new IllegalArgumentException(
                    "Invalid or expired password reset token"
            );
        }

        if (resetToken.getUsedAt() != null) {
            throw new AlreadyEnrolledException(
                    "RESET_TOKEN_USED",
                    "Reset Token Already Used! Please Contact Your Administrator"
            );
        }

        if (resetToken.getExpiresAt().isBefore(now)) {
            throw new AlreadyEnrolledException(
                    "TOKEN_EXPIRED",
                    "Password Reset Token Expired. Please Contact Your Site Admin To Have The Link Sent Resent"
            );
        }

        User user =
                userRepository
                        .findByTenantIdAndId(
                                tenantId,
                                resetToken.getUserId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                         "User not found"
                                ));

        if (passwordPolicyValidator != null) {
            passwordPolicyValidator.validatePassword(tenantId, user.getId(), request.getNewPassword());
        } else {
            validatePasswordPolicy(request.getNewPassword());
        }

        /*
         * Encode using our existing Argon2 PasswordEncoder bean.
         */
        String encodedPassword =
                passwordEncoder.encode(
                        request.getNewPassword()
                );

        user.setPasswordHash(encodedPassword);

        if (passwordPolicyValidator != null) {
            passwordPolicyValidator.recordPasswordChange(tenantId, user.getId(), encodedPassword);
        }

        /*
         * Clear password-related locks and reset requirement.
         * Preserve unrelated administrative, inactivity, or soft locks.
         */
        userSecurityStateRepository
                .findByTenantIdAndUserId(
                        tenantId,
                        user.getId()
                )
                .ifPresent(securityState -> {
                    securityState.setPasswordResetRequired(false);
                    securityState.setLastPasswordResetAt(now);

                    String lockReason = securityState.getLockReason();
                    boolean isPasswordRelatedLock = lockReason != null && (
                            "PASSWORD_RESET_REQUIRED".equalsIgnoreCase(lockReason)
                            || "MAX_FAILED_LOGIN_ATTEMPTS".equalsIgnoreCase(lockReason)
                            || "PASSWORD_EXPIRED".equalsIgnoreCase(lockReason)
                            || "PASSWORD_LOCK".equalsIgnoreCase(lockReason)
                    );

                    if (isPasswordRelatedLock) {
                        securityState.setFailedLoginAttempts(0);
                        securityState.setLockedAt(null);
                        securityState.setLockReason(null);
                        if (!"DISABLED".equalsIgnoreCase(user.getStatus())) {
                            user.setStatus("ACTIVE");
                        }
                    }

                    userSecurityStateRepository.save(securityState);
                });

        userRepository.save(user);

        /*
         * Changing password invalidates existing sessions.
         */
        if (userSessionService != null) {
            userSessionService.revokeExistingSessions(tenantId, user.getId(), "PASSWORD_RESET");
        }

        /*
         * One-time token: mark it consumed.
         */
        resetToken.setUsedAt(now);

        userActionTokenRepository.save(resetToken);
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
}
