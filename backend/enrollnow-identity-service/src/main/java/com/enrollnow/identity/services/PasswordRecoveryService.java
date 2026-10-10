package com.enrollnow.identity.services;

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

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PasswordRecoveryService {

	private static final String TOKEN_TYPE = "PASSWORD_RESET";
    private static final int TOKEN_EXPIRY_MINUTES = 30;

    private final UserEmailRepository userEmailRepository;
    private final UserActionTokenRepository userActionTokenRepository;
    
    private final UserRepository userRepository;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordRecoveryService(
            UserEmailRepository userEmailRepository,
            UserActionTokenRepository userActionTokenRepository,
            UserRepository userRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            PasswordEncoder passwordEncoder) {

        this.userEmailRepository = userEmailRepository;
        this.userActionTokenRepository = userActionTokenRepository;
        this.userRepository = userRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
        this.passwordEncoder = passwordEncoder;
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

        String rawToken = generateToken();

        UserActionToken token = new UserActionToken();

        token.setTenantId(tenantId);
        token.setUserId(userEmail.getUserId());
        token.setTokenType(TOKEN_TYPE);
        token.setTokenHash(hashToken(rawToken));
        token.setExpiresAt(
                now.plusMinutes(TOKEN_EXPIRY_MINUTES)
        );

        userActionTokenRepository.save(token);

        /*
         * Temporary for backend development testing.
         * Later this raw token should be sent by email,
         * not returned to the FE.
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

            return java.util.HexFormat.of()
                    .formatHex(hash);

        } catch (NoSuchAlgorithmException ex) {

            throw new IllegalStateException(
                    "SHA-256 is not available",
                    ex
            );
        }
    }
    
    @Transactional
    public void resetPassword(
            UUID tenantId,
            ResetPasswordRequest request) {

        OffsetDateTime now = OffsetDateTime.now();

        String tokenHash = hashToken(request.getToken());

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

        if (!TOKEN_TYPE.equals(resetToken.getTokenType())) {
            throw new IllegalArgumentException(
                    "Invalid or expired password reset token"
            );
        }

        if (resetToken.getUsedAt() != null) {
            throw new IllegalArgumentException(
                    "Password reset token has already been used"
            );
        }

        if (resetToken.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException(
                    "Password reset token has expired"
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
                                )
                        );

        /*
         * Encode using our existing Argon2 PasswordEncoder bean.
         */
        String encodedPassword =
                passwordEncoder.encode(
                        request.getNewPassword()
                );

        user.setPasswordHash(encodedPassword);

        /*
         * A successful password reset unlocks the account.
         */
        user.setStatus("ACTIVE");

        userRepository.save(user);

        /*
         * Clear failed-login lock information.
         */
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

        /*
         * One-time token: mark it consumed.
         */
        resetToken.setUsedAt(now);

        userActionTokenRepository.save(resetToken);
    }
}