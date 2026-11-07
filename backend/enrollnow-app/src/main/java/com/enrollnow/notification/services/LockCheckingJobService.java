package com.enrollnow.notification.services;

import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LockCheckingJobService {

    private static final Logger log = LoggerFactory.getLogger(LockCheckingJobService.class);

    private final UserRepository userRepository;
    private final UserSecurityStateRepository securityStateRepository;
    private final SecuritySettingsRepository securitySettingsRepository;

    @Autowired
    public LockCheckingJobService(
            UserRepository userRepository,
            UserSecurityStateRepository securityStateRepository,
            SecuritySettingsRepository securitySettingsRepository) {
        this.userRepository = userRepository;
        this.securityStateRepository = securityStateRepository;
        this.securitySettingsRepository = securitySettingsRepository;
    }

    @Transactional
    public void checkLocksDaily() {
        log.info("Running scheduled checkLocksDaily job");
        List<User> users = userRepository.findAll();
        OffsetDateTime now = OffsetDateTime.now();

        for (User user : users) {
            UUID tenantId = user.getTenantId();
            UUID userId = user.getId();

            Optional<UserSecurityState> stateOpt = securityStateRepository.findByTenantIdAndUserId(tenantId, userId);
            if (stateOpt.isEmpty()) {
                continue;
            }

            UserSecurityState state = stateOpt.get();
            // If already locked, skip
            if (state.getLockedAt() != null || "LOCKED".equalsIgnoreCase(user.getStatus())) {
                continue;
            }

            Optional<SecuritySettings> settingsOpt = securitySettingsRepository.findByTenantId(tenantId);
            if (settingsOpt.isEmpty()) {
                continue;
            }

            SecuritySettings settings = settingsOpt.get();

            // 1. Inactivity lock
            Integer inactivityDays = settings.getInactivityLockDays();
            if (inactivityDays != null && inactivityDays > 0) {
                OffsetDateTime threshold = now.minusDays(inactivityDays);
                OffsetDateTime lastLogin = user.getLastLoginAt();
                if (lastLogin != null && lastLogin.isBefore(threshold)) {
                    log.warn("Locking user {} in tenant {} due to inactivity (last login: {})", userId, tenantId, lastLogin);
                    state.setLockedAt(now);
                    state.setLockReason("INACTIVITY_TIMEOUT");
                    user.setStatus("LOCKED");
                    securityStateRepository.save(state);
                    userRepository.save(user);
                    continue;
                }
            }

            // 2. Failed logins lock check
            Integer maxAttempts = settings.getMaxFailedLoginAttempts();
            if (maxAttempts != null && maxAttempts > 0 && state.getFailedLoginAttempts() >= maxAttempts) {
                log.warn("Locking user {} in tenant {} due to excessive failed attempts ({})", userId, tenantId, state.getFailedLoginAttempts());
                state.setLockedAt(now);
                state.setLockReason("MAX_FAILED_LOGIN_ATTEMPTS");
                user.setStatus("LOCKED");
                securityStateRepository.save(state);
                userRepository.save(user);
            }
        }
    }
}
