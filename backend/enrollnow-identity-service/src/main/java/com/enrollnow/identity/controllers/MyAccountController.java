package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.*;
import com.enrollnow.identity.services.MyAccountService;
import com.enrollnow.identity.services.SiteAuthorizationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/account")
public class MyAccountController {

    private final MyAccountService myAccountService;
    private final SiteAuthorizationService siteAuthorizationService;

    @Autowired
    public MyAccountController(
            MyAccountService myAccountService,
            SiteAuthorizationService siteAuthorizationService) {
        this.myAccountService = myAccountService;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    private SiteAuthorizationService.CallerIdentity requireAuthenticatedCaller(UUID targetTenantId) {
        siteAuthorizationService.requireTenantMatch(targetTenantId);
        return siteAuthorizationService.getAuthenticatedCaller()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication is required to access My Account"));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable UUID tenantId) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.getProfile(tenantId, caller.userId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable UUID tenantId,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.updateProfile(tenantId, caller.userId(), request));
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserProfileResponse> patchProfile(
            @PathVariable UUID tenantId,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.updateProfile(tenantId, caller.userId(), request));
    }

    @PostMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable UUID tenantId,
            @Valid @RequestBody ChangePasswordRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        myAccountService.changePassword(tenantId, caller.userId(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/email/request-change")
    public ResponseEntity<Map<String, String>> requestEmailChange(
            @PathVariable UUID tenantId,
            @Valid @RequestBody RequestEmailChangeDto request) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        myAccountService.requestEmailChange(tenantId, caller.userId(), request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Verification email sent. Please check your inbox to confirm your new email address."));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<Map<String, String>> verifyEmail(
            @PathVariable UUID tenantId,
            @Valid @RequestBody VerifyEmailRequest request) {
        UUID authenticatedUserId = siteAuthorizationService.getAuthenticatedCaller()
                .map(SiteAuthorizationService.CallerIdentity::userId)
                .orElse(null);

        myAccountService.verifyEmail(tenantId, authenticatedUserId, request.getToken());
        return ResponseEntity.ok(Map.of("message", "Email verified and updated successfully"));
    }

    @GetMapping("/email/status")
    public ResponseEntity<EmailStatusResponse> getEmailStatus(@PathVariable UUID tenantId) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.getEmailStatus(tenantId, caller.userId()));
    }

    @GetMapping("/recent-logins")
    public ResponseEntity<List<RecentLoginDto>> getRecentLogins(@PathVariable UUID tenantId) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.getRecentLogins(tenantId, caller.userId()));
    }

    @GetMapping("/studies")
    public ResponseEntity<List<StudyNotificationPreferenceDto>> getStudies(@PathVariable UUID tenantId) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.getStudyPreferences(tenantId, caller.userId()));
    }

    @PutMapping("/studies/{studyId}/notifications")
    public ResponseEntity<StudyNotificationPreferenceDto> updateStudyNotifications(
            @PathVariable UUID tenantId,
            @PathVariable UUID studyId,
            @RequestBody UpdateStudyNotificationPreferenceRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.updateStudyPreference(tenantId, caller.userId(), studyId, request));
    }

    @PatchMapping("/studies/{studyId}/notifications")
    public ResponseEntity<StudyNotificationPreferenceDto> patchStudyNotifications(
            @PathVariable UUID tenantId,
            @PathVariable UUID studyId,
            @RequestBody UpdateStudyNotificationPreferenceRequest request) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        return ResponseEntity.ok(myAccountService.updateStudyPreference(tenantId, caller.userId(), studyId, request));
    }

    @PostMapping(value = "/profile-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadProfilePhoto(
            @PathVariable UUID tenantId,
            @RequestParam("file") MultipartFile file) throws IOException {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        String url = myAccountService.updateProfilePhoto(tenantId, caller.userId(), file);
        return ResponseEntity.ok(Map.of("profilePhotoUrl", url));
    }

    @GetMapping("/profile-photo/content")
    public ResponseEntity<byte[]> getProfilePhotoContent(@PathVariable UUID tenantId) throws IOException {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        byte[] content = myAccountService.getProfilePhotoContent(tenantId, caller.userId());
        if (content.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                .header(HttpHeaders.CACHE_CONTROL, "max-age=60")
                .body(content);
    }

    @PostMapping("/send-daily-digest")
    public ResponseEntity<Map<String, String>> sendDailyDigestNow(@PathVariable UUID tenantId) {
        SiteAuthorizationService.CallerIdentity caller = requireAuthenticatedCaller(tenantId);
        myAccountService.sendDailyDigestNow(tenantId, caller.userId());
        return ResponseEntity.ok(Map.of("message", "Daily digest triggered successfully"));
    }
}
