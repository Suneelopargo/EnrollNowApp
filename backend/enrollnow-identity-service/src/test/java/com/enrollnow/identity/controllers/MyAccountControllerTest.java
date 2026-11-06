package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.*;
import com.enrollnow.identity.services.MyAccountService;
import com.enrollnow.identity.services.SiteAuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MyAccountControllerTest {

    @Mock
    private MyAccountService myAccountService;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    private MyAccountController myAccountController;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        myAccountController = new MyAccountController(myAccountService, siteAuthorizationService);
        when(siteAuthorizationService.getAuthenticatedCaller())
                .thenReturn(Optional.of(new SiteAuthorizationService.CallerIdentity(userId, tenantId)));
    }

    @Test
    void getProfile_returnsProfile() {
        UserProfileResponse profile = new UserProfileResponse();
        profile.setUserId(userId);
        profile.setEmail("user@example.com");

        when(myAccountService.getProfile(tenantId, userId)).thenReturn(profile);

        ResponseEntity<UserProfileResponse> response = myAccountController.getProfile(tenantId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(userId, response.getBody().getUserId());
        assertEquals("user@example.com", response.getBody().getEmail());
    }

    @Test
    void updateProfile_returnsUpdatedProfile() {
        UpdateUserProfileRequest req = new UpdateUserProfileRequest();
        req.setFirstName("John");

        UserProfileResponse updated = new UserProfileResponse();
        updated.setFirstName("John");

        when(myAccountService.updateProfile(tenantId, userId, req)).thenReturn(updated);

        ResponseEntity<UserProfileResponse> response = myAccountController.updateProfile(tenantId, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("John", response.getBody().getFirstName());
    }

    @Test
    void changePassword_success() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("OldPass123!");
        req.setNewPassword("NewPass123!");
        req.setConfirmPassword("NewPass123!");

        ResponseEntity<Map<String, String>> response = myAccountController.changePassword(tenantId, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(myAccountService).changePassword(tenantId, userId, req);
    }

    @Test
    void getRecentLogins_returnsList() {
        RecentLoginDto login = new RecentLoginDto();
        login.setIpAddress("127.0.0.1");

        when(myAccountService.getRecentLogins(tenantId, userId)).thenReturn(List.of(login));

        ResponseEntity<List<RecentLoginDto>> response = myAccountController.getRecentLogins(tenantId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("127.0.0.1", response.getBody().get(0).getIpAddress());
    }

    @Test
    void getStudies_returnsList() {
        StudyNotificationPreferenceDto pref = new StudyNotificationPreferenceDto();
        pref.setStudyName("Study A");
        pref.setDailyDigest(true);

        when(myAccountService.getStudyPreferences(tenantId, userId)).thenReturn(List.of(pref));

        ResponseEntity<List<StudyNotificationPreferenceDto>> response = myAccountController.getStudies(tenantId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("Study A", response.getBody().get(0).getStudyName());
    }

    @Test
    void updateStudyNotifications_updatesAndReturns() {
        UUID studyId = UUID.randomUUID();
        UpdateStudyNotificationPreferenceRequest req = new UpdateStudyNotificationPreferenceRequest();
        req.setDailyDigest(false);

        StudyNotificationPreferenceDto updated = new StudyNotificationPreferenceDto();
        updated.setStudyId(studyId);
        updated.setDailyDigest(false);

        when(myAccountService.updateStudyPreference(tenantId, userId, studyId, req)).thenReturn(updated);

        ResponseEntity<StudyNotificationPreferenceDto> response = myAccountController.updateStudyNotifications(tenantId, studyId, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(response.getBody().isDailyDigest());
    }
}
