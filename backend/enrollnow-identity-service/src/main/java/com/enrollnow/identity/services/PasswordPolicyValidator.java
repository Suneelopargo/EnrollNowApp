package com.enrollnow.identity.services;

import com.enrollnow.identity.models.SecuritySettings;
import com.enrollnow.identity.models.UserPasswordHistory;
import com.enrollnow.identity.repositories.SecuritySettingsRepository;
import com.enrollnow.identity.repositories.UserPasswordHistoryRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PasswordPolicyValidator {

    private final SecuritySettingsRepository securitySettingsRepository;
    private final UserPasswordHistoryRepository userPasswordHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordPolicyValidator(
            SecuritySettingsRepository securitySettingsRepository,
            UserPasswordHistoryRepository userPasswordHistoryRepository,
            PasswordEncoder passwordEncoder) {
        this.securitySettingsRepository = securitySettingsRepository;
        this.userPasswordHistoryRepository = userPasswordHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void validatePassword(UUID tenantId, UUID userId, String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        SecuritySettings settings = securitySettingsRepository.findByTenantId(tenantId)
                .orElse(null);

        int minLength = settings != null && settings.getMinimumPasswordLength() != null
                ? settings.getMinimumPasswordLength()
                : 10;
        boolean requireDigit = settings == null || settings.isRequireDigit();
        boolean requireSymbol = settings == null || settings.isRequireSymbol();
        boolean requireMixedCase = settings == null || settings.isRequireMixedCase();
        int historyCount = settings != null && settings.getPasswordHistoryCount() != null
                ? settings.getPasswordHistoryCount()
                : 4;
        String minStrength = settings != null && settings.getMinimumPasswordStrength() != null
                ? settings.getMinimumPasswordStrength().toUpperCase()
                : "MODERATE";

        if (password.length() < minLength) {
            throw new IllegalArgumentException("Password must be at least " + minLength + " characters long");
        }

        if (requireDigit && !password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Password must contain at least one digit");
        }

        if (requireSymbol && !password.matches(".*[^0-9A-Za-z].*")) {
            throw new IllegalArgumentException("Password must contain at least one symbol");
        }

        if (requireMixedCase && (!password.matches(".*[a-z].*") || !password.matches(".*[A-Z].*"))) {
            throw new IllegalArgumentException("Password must contain mixed upper and lower case characters");
        }

        if ("STRONG".equalsIgnoreCase(minStrength)) {
            if (password.length() < Math.max(minLength, 12)) {
                throw new IllegalArgumentException("Strong password must be at least 12 characters long");
            }
        }

        if (historyCount > 0 && userId != null) {
            List<UserPasswordHistory> historyList = userPasswordHistoryRepository
                    .findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId);

            int checkLimit = Math.min(historyCount, historyList.size());
            for (int i = 0; i < checkLimit; i++) {
                UserPasswordHistory hist = historyList.get(i);
                if (passwordEncoder.matches(password, hist.getPasswordHash())) {
                    throw new IllegalArgumentException(
                            "Cannot reuse any of your last " + historyCount + " passwords"
                    );
                }
            }
        }
    }

    public void recordPasswordChange(UUID tenantId, UUID userId, String encodedPassword) {
        if (tenantId == null || userId == null || encodedPassword == null) {
            return;
        }
        UserPasswordHistory history = new UserPasswordHistory();
        history.setTenantId(tenantId);
        history.setUserId(userId);
        history.setPasswordHash(encodedPassword);
        history.setCreatedAt(OffsetDateTime.now());
        userPasswordHistoryRepository.save(history);
    }
}
