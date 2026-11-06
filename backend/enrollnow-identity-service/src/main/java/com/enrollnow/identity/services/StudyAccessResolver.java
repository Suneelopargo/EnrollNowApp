package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.StudyNotificationPreferenceDto;
import com.enrollnow.identity.dtos.UpdateStudyNotificationPreferenceRequest;

import java.util.List;
import java.util.UUID;

public interface StudyAccessResolver {

    List<StudyNotificationPreferenceDto> resolveUserStudies(UUID tenantId, UUID userId);

    StudyNotificationPreferenceDto updateStudyNotificationPreference(
            UUID tenantId,
            UUID userId,
            UUID studyId,
            UpdateStudyNotificationPreferenceRequest request
    );

    boolean isUserActiveStudyMember(UUID tenantId, UUID userId, UUID studyId);
}
