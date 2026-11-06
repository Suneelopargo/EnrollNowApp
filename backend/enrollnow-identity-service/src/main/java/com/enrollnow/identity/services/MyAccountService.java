package com.enrollnow.identity.services;

import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditRequest;
import com.enrollnow.common.security.SecurityTokenHelper;
import com.enrollnow.identity.dtos.*;
import com.enrollnow.identity.exceptions.AlreadyEnrolledException;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.*;
import com.enrollnow.identity.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class MyAccountService {

    private static final Logger log = LoggerFactory.getLogger(MyAccountService.class);
    private static final long MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    private static final String TOKEN_TYPE_EMAIL_VERIFICATION = "EMAIL_VERIFICATION";

    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final UserActionTokenRepository userActionTokenRepository;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final SecuritySettingsRepository securitySettingsRepository;
    private final UserLoginActivityRepository userLoginActivityRepository;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final PasswordEncoder passwordEncoder;
    private final InvitationEmailService invitationEmailService;
    private final AuditRecorder auditRecorder;
    private final StudyAccessResolver studyAccessResolver;

    @Value("${app.environment:development}")
    private String environment = "development";

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDir = "./uploads";

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Autowired
    public MyAccountService(
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            UserActionTokenRepository userActionTokenRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            SecuritySettingsRepository securitySettingsRepository,
            UserLoginActivityRepository userLoginActivityRepository,
            PasswordPolicyValidator passwordPolicyValidator,
            PasswordEncoder passwordEncoder,
            InvitationEmailService invitationEmailService,
            @Autowired(required = false) AuditRecorder auditRecorder,
            @Autowired(required = false) StudyAccessResolver studyAccessResolver) {
        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.userActionTokenRepository = userActionTokenRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
        this.securitySettingsRepository = securitySettingsRepository;
        this.userLoginActivityRepository = userLoginActivityRepository;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.passwordEncoder = passwordEncoder;
        this.invitationEmailService = invitationEmailService;
        this.auditRecorder = auditRecorder;
        this.studyAccessResolver = studyAccessResolver;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID tenantId, UUID userId) {
        User user = userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Optional<UserEmail> primaryEmailOpt = userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, userId);

        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(user.getId());
        response.setTenantId(user.getTenantId());
        response.setTitle(user.getTitle());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setProfilePhotoUrl(user.getProfilePhotoUrl());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLoginAt(user.getLastLoginAt());
        response.setTimezone(user.getTimezone());
        response.setIgnoreTimezoneMismatch(user.isIgnoreTimezoneMismatch());

        if (primaryEmailOpt.isPresent()) {
            UserEmail pe = primaryEmailOpt.get();
            response.setEmail(pe.getEmail());
            response.setEmailVerified(pe.isVerified());
        } else {
            response.setEmail("");
            response.setEmailVerified(false);
        }

        Integer expiringDays = calculatePasswordExpiringDays(tenantId, user);
        response.setPasswordExpiringDays(expiringDays);

        return response;
    }

    private Integer calculatePasswordExpiringDays(UUID tenantId, User user) {
        Optional<SecuritySettings> settingsOpt = securitySettingsRepository.findByTenantId(tenantId);
        if (settingsOpt.isEmpty() || settingsOpt.get().getPasswordExpiryDays() == null || settingsOpt.get().getPasswordExpiryDays() <= 0) {
            return null;
        }

        int expiryDays = settingsOpt.get().getPasswordExpiryDays();
        OffsetDateTime lastChange = user.getPasswordLastChangedAt();
        if (lastChange == null) {
            Optional<UserSecurityState> secOpt = userSecurityStateRepository.findByTenantIdAndUserId(tenantId, user.getId());
            if (secOpt.isPresent() && secOpt.get().getLastPasswordResetAt() != null) {
                lastChange = secOpt.get().getLastPasswordResetAt();
            } else {
                lastChange = user.getCreatedAt();
            }
        }

        if (lastChange == null) {
            return null;
        }

        OffsetDateTime expiresAt = lastChange.plusDays(expiryDays);
        long daysRemaining = ChronoUnit.DAYS.between(OffsetDateTime.now(), expiresAt);
        return (int) Math.max(0, daysRemaining);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID tenantId, UUID userId, UpdateUserProfileRequest request) {
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            validateTimezone(request.getTimezone().trim());
        }

        User user = userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Map<String, Object> before = snapshotUser(user);

        if (request.getFirstName() != null) {
            String trimmedFirst = request.getFirstName().trim();
            if (trimmedFirst.isEmpty()) {
                throw new IllegalArgumentException("First Name is required");
            }
            user.setFirstName(trimmedFirst);
        }

        if (request.getLastName() != null) {
            String trimmedLast = request.getLastName().trim();
            if (trimmedLast.isEmpty()) {
                throw new IllegalArgumentException("Last Name is required");
            }
            user.setLastName(trimmedLast);
        }

        if (user.getLastName() == null || user.getLastName().trim().isEmpty()) {
            throw new IllegalArgumentException("Last Name is required");
        }

        if (request.getTitle() != null) {
            user.setTitle(request.getTitle().trim().isEmpty() ? null : request.getTitle().trim());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim().isEmpty() ? null : request.getPhoneNumber().trim());
        }

        boolean timezoneChanged = false;
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            String trimmedTz = request.getTimezone().trim();
            timezoneChanged = !Objects.equals(user.getTimezone(), trimmedTz);
            user.setTimezone(trimmedTz);
        }

        if (request.getIgnoreTimezoneMismatch() != null) {
            user.setIgnoreTimezoneMismatch(request.getIgnoreTimezoneMismatch());
        }

        user.setUpdatedAt(OffsetDateTime.now());
        User savedUser = userRepository.save(user);

        Map<String, Object> after = snapshotUser(savedUser);

        if (auditRecorder != null) {
            if (timezoneChanged) {
                auditRecorder.record(new AuditRequest(
                        tenantId,
                        "USER",
                        userId,
                        "USER_TIMEZONE_UPDATED",
                        "User timezone updated to " + user.getTimezone(),
                        "API",
                        List.of(new AuditEntitySnapshot("USER", userId, before, after))
                ));
            }

            auditRecorder.record(new AuditRequest(
                    tenantId,
                    "USER",
                    userId,
                    "USER_PROFILE_UPDATED",
                    "User profile details updated",
                    "API",
                    List.of(new AuditEntitySnapshot("USER", userId, before, after))
            ));
        }

        return getProfile(tenantId, userId);
    }

    private void validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
        } catch (Exception e) {
            if (!ZoneId.getAvailableZoneIds().contains(timezone)) {
                throw new IllegalArgumentException("Unsupported or invalid timezone: " + timezone);
            }
        }
    }

    @Transactional
    public void changePassword(UUID tenantId, UUID userId, ChangePasswordRequest request) {
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new IllegalArgumentException("Current password is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }
        if (request.getConfirmPassword() == null || request.getConfirmPassword().isBlank()) {
            throw new IllegalArgumentException("Confirm password is required");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match!");
        }

        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new IllegalArgumentException("You must enter a different (new) password.");
        }

        User user = userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("The current password you entered is incorrect.");
        }

        passwordPolicyValidator.validatePassword(tenantId, userId, request.getNewPassword());

        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(encodedPassword);
        OffsetDateTime now = OffsetDateTime.now();
        user.setPasswordLastChangedAt(now);
        userRepository.save(user);

        passwordPolicyValidator.recordPasswordChange(tenantId, userId, encodedPassword);

        userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId).ifPresent(sec -> {
            sec.setLastPasswordResetAt(now);
            sec.setFailedLoginAttempts(0);
            sec.setPasswordResetRequired(false);
            if ("PASSWORD_EXPIRED".equalsIgnoreCase(sec.getLockReason()) || "PASSWORD_RESET_REQUIRED".equalsIgnoreCase(sec.getLockReason())) {
                sec.setLockedAt(null);
                sec.setLockReason(null);
                if (!"DISABLED".equalsIgnoreCase(user.getStatus())) {
                    user.setStatus("ACTIVE");
                    userRepository.save(user);
                }
            }
            userSecurityStateRepository.save(sec);
        });

        if (auditRecorder != null) {
            auditRecorder.record(new AuditRequest(
                    tenantId,
                    "USER",
                    userId,
                    "USER_PASSWORD_CHANGED",
                    "User changed password",
                    "API",
                    List.of(new AuditEntitySnapshot("USER", userId, Map.of("passwordHash", "REDACTED"), Map.of("passwordHash", "REDACTED", "changedAt", now.toString())))
            ));
        }
    }

    @Transactional
    public void requestEmailChange(UUID tenantId, UUID userId, String requestedEmail) {
        if (requestedEmail == null || requestedEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Email address is required");
        }

        String normalizedEmail = requestedEmail.trim().toLowerCase(Locale.ROOT);
        if (!normalizedEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Please enter a valid email address");
        }

        User user = userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Optional<UserEmail> existingByEmail = userEmailRepository.findByTenantIdAndEmailIgnoreCase(tenantId, normalizedEmail);
        if (existingByEmail.isPresent()) {
            UserEmail existing = existingByEmail.get();
            if (!existing.getUserId().equals(userId)) {
                throw new IllegalArgumentException("A user with this email address already exists");
            }
            if (existing.isPrimaryEmail() && existing.isVerified()) {
                throw new IllegalArgumentException("This is already your verified primary email address");
            }
        }

        List<UserActionToken> oldTokens = userActionTokenRepository
                .findByTenantIdAndUserIdAndTokenTypeAndUsedAtIsNull(tenantId, userId, TOKEN_TYPE_EMAIL_VERIFICATION);
        for (UserActionToken token : oldTokens) {
            token.setUsedAt(OffsetDateTime.now());
            userActionTokenRepository.save(token);
        }

        UserEmail pendingEmailRow = userEmailRepository
                .findByTenantIdAndUserIdAndEmailIgnoreCase(tenantId, userId, normalizedEmail)
                .orElseGet(() -> {
                    UserEmail newEmail = new UserEmail();
                    newEmail.setTenantId(tenantId);
                    newEmail.setUserId(userId);
                    newEmail.setEmail(normalizedEmail);
                    return newEmail;
                });
        pendingEmailRow.setVerified(false);
        pendingEmailRow.setPrimaryEmail(false);
        userEmailRepository.save(pendingEmailRow);

        String rawToken = SecurityTokenHelper.generateSecureToken();
        String tokenHash = SecurityTokenHelper.hashToken(rawToken);

        UserActionToken actionToken = new UserActionToken();
        actionToken.setTenantId(tenantId);
        actionToken.setUserId(userId);
        actionToken.setTokenType(TOKEN_TYPE_EMAIL_VERIFICATION);
        actionToken.setTokenHash(tokenHash);
        actionToken.setExpiresAt(OffsetDateTime.now().plusHours(24));
        userActionTokenRepository.save(actionToken);

        invitationEmailService.sendEmailVerification(normalizedEmail, user.getFirstName(), tenantId.toString(), rawToken);

        if (auditRecorder != null) {
            auditRecorder.record(new AuditRequest(
                    tenantId,
                    "USER_EMAIL",
                    userId,
                    "USER_EMAIL_CHANGE_REQUESTED",
                    "Email change requested for new address " + normalizedEmail,
                    "API",
                    List.of(new AuditEntitySnapshot("USER_EMAIL", userId, Map.of("pendingEmail", ""), Map.of("pendingEmail", normalizedEmail)))
            ));
        }
    }

    @Transactional
    public void verifyEmail(UUID tenantId, UUID authenticatedUserId, String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Verification token is required");
        }

        String tokenHash = SecurityTokenHelper.hashToken(rawToken.trim());
        UserActionToken actionToken = userActionTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired email verification token"));

        if (!TOKEN_TYPE_EMAIL_VERIFICATION.equals(actionToken.getTokenType())) {
            throw new IllegalArgumentException("Invalid verification token type");
        }

        if (tenantId != null && !tenantId.equals(actionToken.getTenantId())) {
            throw new IllegalArgumentException("Token does not match tenant context");
        }

        if (authenticatedUserId != null && !authenticatedUserId.equals(actionToken.getUserId())) {
            throw new AccessDeniedException("Verification token does not belong to authenticated user");
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (actionToken.getUsedAt() != null) {
            throw new AlreadyEnrolledException("VERIFICATION_TOKEN_USED", "Email verification token has already been used");
        }

        if (actionToken.getExpiresAt().isBefore(now)) {
            throw new AlreadyEnrolledException("TOKEN_EXPIRED", "Email verification token has expired. Please request a new verification link.");
        }

        UUID targetUserId = actionToken.getUserId();
        UUID effectiveTenantId = actionToken.getTenantId();

        List<UserEmail> userEmails = userEmailRepository.findByTenantIdAndUserId(effectiveTenantId, targetUserId);
        Optional<UserEmail> unverifiedOpt = userEmails.stream().filter(e -> !e.isVerified()).findFirst();

        if (unverifiedOpt.isEmpty()) {
            throw new IllegalStateException("No pending unverified email found for user");
        }

        UserEmail newEmail = unverifiedOpt.get();

        for (UserEmail email : userEmails) {
            if (email.getId().equals(newEmail.getId())) {
                email.setVerified(true);
                email.setPrimaryEmail(true);
            } else {
                email.setPrimaryEmail(false);
            }
            userEmailRepository.save(email);
        }

        actionToken.setUsedAt(now);
        userActionTokenRepository.save(actionToken);

        if (auditRecorder != null) {
            auditRecorder.record(new AuditRequest(
                    effectiveTenantId,
                    "USER_EMAIL",
                    targetUserId,
                    "USER_EMAIL_VERIFIED",
                    "Email successfully verified and updated to " + newEmail.getEmail(),
                    "API",
                    List.of(new AuditEntitySnapshot("USER_EMAIL", targetUserId, Map.of("verified", false), Map.of("verified", true, "primaryEmail", newEmail.getEmail())))
            ));
        }
    }

    @Transactional(readOnly = true)
    public EmailStatusResponse getEmailStatus(UUID tenantId, UUID userId) {
        List<UserEmail> emails = userEmailRepository.findByTenantIdAndUserId(tenantId, userId);
        Optional<UserEmail> primary = emails.stream().filter(UserEmail::isPrimaryEmail).findFirst();
        Optional<UserEmail> pending = emails.stream().filter(e -> !e.isVerified() && !e.isPrimaryEmail()).findFirst();

        String currentAddress = primary.map(UserEmail::getEmail).orElse("");
        boolean verified = primary.map(UserEmail::isVerified).orElse(false);
        String pendingAddress = pending.map(UserEmail::getEmail).orElse(null);
        boolean pendingVerification = pending.isPresent();

        return new EmailStatusResponse(currentAddress, verified, pendingAddress, pendingVerification);
    }

    @Transactional(readOnly = true)
    public List<RecentLoginDto> getRecentLogins(UUID tenantId, UUID userId) {
        List<UserLoginActivity> list = userLoginActivityRepository
                .findTop5ByTenantIdAndUserIdOrderByLoginAtDesc(tenantId, userId);

        return list.stream()
                .map(a -> new RecentLoginDto(a.getLoginAt(), a.getIpAddress(), a.getUserAgent()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudyNotificationPreferenceDto> getStudyPreferences(UUID tenantId, UUID userId) {
        if (studyAccessResolver != null) {
            return studyAccessResolver.resolveUserStudies(tenantId, userId);
        }
        return Collections.emptyList();
    }

    @Transactional
    public StudyNotificationPreferenceDto updateStudyPreference(
            UUID tenantId,
            UUID userId,
            UUID studyId,
            UpdateStudyNotificationPreferenceRequest request) {

        if (studyAccessResolver != null) {
            return studyAccessResolver.updateStudyNotificationPreference(tenantId, userId, studyId, request);
        }
        throw new IllegalStateException("Study access resolution service is unavailable");
    }

    @Transactional
    public String updateProfilePhoto(UUID tenantId, UUID userId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }

        if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
            throw new IllegalArgumentException("Image size exceeds maximum allowed limit of 5MB");
        }

        byte[] bytes = file.getBytes();
        if (!isValidImage(bytes)) {
            throw new IllegalArgumentException("Invalid file format. Please upload a valid image (JPEG, PNG, GIF, or WebP).");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !mimeType.startsWith("image/")) {
            mimeType = detectMimeType(bytes);
        }
        String base64Image = "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(bytes);

        User user = userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Map<String, Object> before = snapshotUser(user);
        user.setProfilePhotoUrl(base64Image);
        user.setUpdatedAt(OffsetDateTime.now());
        User savedUser = userRepository.save(user);
        if (savedUser == null) {
            savedUser = user;
        }
        Map<String, Object> after = snapshotUser(savedUser);

        if (auditRecorder != null) {
            auditRecorder.record(new AuditRequest(
                    tenantId,
                    "USER",
                    userId,
                    "USER_PROFILE_IMAGE_UPDATED",
                    "User profile photo updated",
                    "API",
                    List.of(new AuditEntitySnapshot("USER", userId, before, after))
            ));
        }

        return base64Image;
    }

    @Transactional(readOnly = true)
    public byte[] getProfilePhotoContent(UUID tenantId, UUID userId) throws IOException {
        User user = userRepository.findByTenantIdAndId(tenantId, userId).orElse(null);
        if (user != null && user.getProfilePhotoUrl() != null && user.getProfilePhotoUrl().contains(";base64,")) {
            String b64 = user.getProfilePhotoUrl().substring(user.getProfilePhotoUrl().indexOf(";base64,") + 8);
            return Base64.getDecoder().decode(b64);
        }

        Path uploadPath = Paths.get(uploadDir, "profiles", tenantId.toString());
        if (!Files.exists(uploadPath)) {
            return new byte[0];
        }

        Optional<Path> latest = Files.list(uploadPath)
                .filter(p -> p.getFileName().toString().startsWith(userId.toString()))
                .max(Comparator.comparingLong(p -> p.toFile().lastModified()));

        if (latest.isPresent()) {
            return Files.readAllBytes(latest.get());
        }
        return new byte[0];
    }

    private String detectMimeType(byte[] bytes) {
        if (bytes != null && bytes.length >= 4) {
            if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
                return "image/jpeg";
            }
            if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
                return "image/png";
            }
            if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F') {
                return "image/gif";
            }
            if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
                return "image/webp";
            }
        }
        return "image/jpeg";
    }

    private boolean isValidImage(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return false;
        }
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return true;
        }
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
            return true;
        }
        if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F') {
            return true;
        }
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return true;
        }
        return false;
    }

    public void sendDailyDigestNow(UUID tenantId, UUID userId) {
        boolean isDevOrStaging = "development".equalsIgnoreCase(environment) || "staging".equalsIgnoreCase(environment) || "local".equalsIgnoreCase(environment);
        if (!isDevOrStaging) {
            throw new AccessDeniedException("Daily digest manual trigger is only allowed in development or staging environments");
        }

        log.info("Triggered immediate daily digest email for tenant {} and user {}", tenantId, userId);
    }

    private Map<String, Object> snapshotUser(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("firstName", user.getFirstName());
        map.put("lastName", user.getLastName());
        map.put("title", user.getTitle());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("timezone", user.getTimezone());
        map.put("ignoreTimezoneMismatch", user.isIgnoreTimezoneMismatch());
        map.put("profilePhotoUrl", user.getProfilePhotoUrl());
        return map;
    }
}
