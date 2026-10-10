package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.LoginRequest;
import com.enrollnow.identity.dtos.LoginResponse;
import com.enrollnow.identity.exceptions.AccountDisabledException;
import com.enrollnow.identity.exceptions.AccountLockedException;
import com.enrollnow.identity.exceptions.InvalidCredentialsException;
import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class LoginService {

    private static final int DEFAULT_MAX_FAILED_LOGIN_ATTEMPTS = 5;

    private final UserEmailRepository userEmailRepository;
    private final UserRepository userRepository;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final SecuritySettingsRepository securitySettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final UserSessionService userSessionService;

    public LoginService(
            UserEmailRepository userEmailRepository,
            UserRepository userRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            SecuritySettingsRepository securitySettingsRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService,
            UserSessionService userSessionService) {

        this.userEmailRepository = userEmailRepository;
        this.userRepository = userRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
        this.securitySettingsRepository = securitySettingsRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.userSessionService = userSessionService;
    }

    @Transactional(noRollbackFor = InvalidCredentialsException.class)
    public LoginResponse authenticate(
            UUID tenantId,
            LoginRequest request) {

        String normalizedEmail =
                request.getEmail()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        UserEmail userEmail =
                userEmailRepository
                        .findByTenantIdAndEmailIgnoreCase(
                                tenantId,
                                normalizedEmail)
                        .orElseThrow(InvalidCredentialsException::new);

        User user =
                userRepository
                        .findByTenantIdAndId(
                                tenantId,
                                userEmail.getUserId())
                        .orElseThrow(InvalidCredentialsException::new);

        if ("DISABLED".equalsIgnoreCase(user.getStatus())) {
            throw new AccountDisabledException();
        }

        UserSecurityState securityState =
                userSecurityStateRepository
                        .findByTenantIdAndUserId(
                                tenantId,
                                user.getId())
                        .orElseGet(() -> createSecurityState(
                                tenantId,
                                user.getId()));

        if ("LOCKED".equalsIgnoreCase(user.getStatus())
                || securityState.getLockedAt() != null) {

            throw new AccountLockedException();
        }

        String passwordHash = user.getPasswordHash();

        if (passwordHash == null
                || passwordHash.isBlank()
                || !passwordEncoder.matches(
                        request.getPassword(),
                        passwordHash)) {

            handleFailedLogin(
                    tenantId,
                    user,
                    securityState);

            throw new InvalidCredentialsException();
        }

        OffsetDateTime now = OffsetDateTime.now();

        securityState.setFailedLoginAttempts(0);
        securityState.setLastActivityAt(now);

        userSecurityStateRepository.save(securityState);

        user.setLastLoginAt(now);
        userRepository.save(user);

        LoginResponse response = new LoginResponse();

        response.setUserId(user.getId());
        response.setTenantId(user.getTenantId());
        response.setEmail(userEmail.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());

        /*
         * JWT will be added in the next implementation step.
         */
        String accessToken =
                jwtTokenService.generateToken(
                        user.getTenantId(),
                        user.getId(),
                        userEmail.getEmail()
                );
        
        userSessionService.createSession(
                user.getTenantId(),
                user.getId(),
                accessToken,
                jwtTokenService.getExpirationSeconds()
        );

        response.setAccessToken(accessToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(
                jwtTokenService.getExpirationSeconds()
        );

        return response;
    }

    private void handleFailedLogin(
            UUID tenantId,
            User user,
            UserSecurityState securityState) {

        int failedAttempts =
                securityState.getFailedLoginAttempts() + 1;

        securityState.setFailedLoginAttempts(failedAttempts);

        int maxFailedAttempts =
                securitySettingsRepository
                        .findByTenantId(tenantId)
                        .map(SecuritySettings::getMaxFailedLoginAttempts)
                        .filter(value -> value != null && value > 0)
                        .orElse(DEFAULT_MAX_FAILED_LOGIN_ATTEMPTS);

        if (failedAttempts >= maxFailedAttempts) {

            securityState.setLockedAt(OffsetDateTime.now());
            securityState.setLockReason(
                    "MAX_FAILED_LOGIN_ATTEMPTS");

            user.setStatus("LOCKED");
            userRepository.save(user);
        }

        userSecurityStateRepository.save(securityState);
    }

    private UserSecurityState createSecurityState(
            UUID tenantId,
            UUID userId) {

        UserSecurityState state =
                new UserSecurityState();

        state.setTenantId(tenantId);
        state.setUserId(userId);
        state.setFailedLoginAttempts(0);

        return userSecurityStateRepository.save(state);
    }
}