package com.enrollnow.study.services;

import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditRequest;
import com.enrollnow.identity.dtos.StudyNotificationPreferenceDto;
import com.enrollnow.identity.dtos.UpdateStudyNotificationPreferenceRequest;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.models.UserStudyNotificationPreference;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.identity.repositories.UserStudyNotificationPreferenceRepository;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.identity.services.StudyAccessResolver;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class StudyAccessResolverImpl implements StudyAccessResolver {

    private final StudyMemberRepository studyMemberRepository;
    private final StudyRepository studyRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final RoleRepository roleRepository;
    private final UserStudyNotificationPreferenceRepository notificationPreferenceRepository;
    private final AuditRecorder auditRecorder;

    @Autowired
    public StudyAccessResolverImpl(
            StudyMemberRepository studyMemberRepository,
            StudyRepository studyRepository,
            UserRoleAssignmentRepository userRoleAssignmentRepository,
            RoleRepository roleRepository,
            UserStudyNotificationPreferenceRepository notificationPreferenceRepository,
            @Autowired(required = false) AuditRecorder auditRecorder) {
        this.studyMemberRepository = studyMemberRepository;
        this.studyRepository = studyRepository;
        this.userRoleAssignmentRepository = userRoleAssignmentRepository;
        this.roleRepository = roleRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.auditRecorder = auditRecorder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudyNotificationPreferenceDto> resolveUserStudies(UUID tenantId, UUID userId) {
        if (tenantId == null || userId == null) {
            return Collections.emptyList();
        }

        List<StudyMember> memberships = studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId);
        if (memberships.isEmpty()) {
            return Collections.emptyList();
        }

        OffsetDateTime now = OffsetDateTime.now();
        List<StudyNotificationPreferenceDto> result = new ArrayList<>();

        for (StudyMember member : memberships) {
            UUID studyId = member.getId().getStudyId();
            Optional<Study> studyOpt = studyRepository.findByTenantIdAndId(tenantId, studyId);
            if (studyOpt.isEmpty() || studyOpt.get().isArchived()) {
                continue;
            }

            Study study = studyOpt.get();
            StudyNotificationPreferenceDto dto = new StudyNotificationPreferenceDto();
            dto.setStudyId(studyId);
            dto.setStudyName(study.getName());
            dto.setStudyCode(study.getStudyCode());

            String studyRole = member.getStudyRole();
            if (studyRole == null || studyRole.isBlank()) {
                studyRole = "Coordinator";
            }
            dto.setStudyRole(studyRole);

            // Resolve Access Role
            String accessRole = resolveStudyAccessRole(tenantId, userId, studyId, now);
            dto.setAccessRole(accessRole);

            // Resolve Notification Preferences
            Optional<UserStudyNotificationPreference> prefOpt =
                    notificationPreferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, userId, studyId);
            if (prefOpt.isPresent()) {
                UserStudyNotificationPreference pref = prefOpt.get();
                dto.setDailyDigest(pref.isDailyDigest());
                dto.setTaskEmails(pref.isTaskEmails());
                dto.setParticipantEmails(pref.isParticipantEmails());
                dto.setSurveySubmissions(pref.isSurveySubmissions());
            } else {
                dto.setDailyDigest(false);
                dto.setTaskEmails(false);
                dto.setParticipantEmails(false);
                dto.setSurveySubmissions(false);
            }

            result.add(dto);
        }

        return result;
    }

    private String resolveStudyAccessRole(UUID tenantId, UUID userId, UUID studyId, OffsetDateTime now) {
        List<UserRoleAssignment> assignments =
                userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, userId, studyId);

        List<Role> activeRoles = assignments.stream()
                .filter(a -> SitePermissionService.isAssignmentEffective(a, now))
                .map(a -> roleRepository.findById(a.getRoleId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();

        if (activeRoles.isEmpty()) {
            return "Study Read-Only";
        }

        // Check highest privilege ordering matching legacy Ripple: Admin > Leader > RA > ReadOnly
        for (String code : List.of("STUDY_ADMIN", "STUDY_LEADER", "STUDY_RA", "STUDY_READ_ONLY")) {
            for (Role role : activeRoles) {
                if (code.equalsIgnoreCase(role.getCode())) {
                    return role.getName() != null ? role.getName() : formatRoleCode(code);
                }
            }
        }

        return activeRoles.get(0).getName() != null ? activeRoles.get(0).getName() : activeRoles.get(0).getCode();
    }

    private String formatRoleCode(String code) {
        if ("STUDY_ADMIN".equalsIgnoreCase(code)) return "Study Admin";
        if ("STUDY_LEADER".equalsIgnoreCase(code)) return "Study Leader";
        if ("STUDY_RA".equalsIgnoreCase(code)) return "Study Restricted Access";
        if ("STUDY_READ_ONLY".equalsIgnoreCase(code)) return "Study Read-Only";
        return code;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserActiveStudyMember(UUID tenantId, UUID userId, UUID studyId) {
        if (tenantId == null || userId == null || studyId == null) {
            return false;
        }
        return studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, userId)
                .filter(StudyMember::isActive)
                .isPresent();
    }

    @Override
    @Transactional
    public StudyNotificationPreferenceDto updateStudyNotificationPreference(
            UUID tenantId,
            UUID userId,
            UUID studyId,
            UpdateStudyNotificationPreferenceRequest request) {

        if (tenantId == null || userId == null || studyId == null) {
            throw new IllegalArgumentException("Tenant ID, User ID, and Study ID are required");
        }

        StudyMember member = studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, userId)
                .filter(StudyMember::isActive)
                .orElseThrow(() -> new AccessDeniedException("User is not an active member of the specified study"));

        Study study = studyRepository.findByTenantIdAndId(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found with ID: " + studyId));

        if (study.isArchived()) {
            throw new IllegalArgumentException("Cannot update notification preferences for an archived study");
        }

        UserStudyNotificationPreference pref = notificationPreferenceRepository
                .findByTenantIdAndUserIdAndStudyId(tenantId, userId, studyId)
                .orElseGet(() -> {
                    UserStudyNotificationPreference newPref = new UserStudyNotificationPreference();
                    newPref.setTenantId(tenantId);
                    newPref.setUserId(userId);
                    newPref.setStudyId(studyId);
                    newPref.setCreatedBy(userId);
                    return newPref;
                });

        Map<String, Object> before = snapshotPreferences(pref);

        if (request.getDailyDigest() != null) {
            pref.setDailyDigest(request.getDailyDigest());
        }
        if (request.getTaskEmails() != null) {
            pref.setTaskEmails(request.getTaskEmails());
        }
        if (request.getParticipantEmails() != null) {
            pref.setParticipantEmails(request.getParticipantEmails());
        }
        if (request.getSurveySubmissions() != null) {
            pref.setSurveySubmissions(request.getSurveySubmissions());
        }

        pref.setUpdatedBy(userId);
        UserStudyNotificationPreference saved = notificationPreferenceRepository.save(pref);

        Map<String, Object> after = snapshotPreferences(saved);

        if (auditRecorder != null) {
            auditRecorder.record(
                    new AuditRequest(
                            tenantId,
                            "USER_STUDY_NOTIFICATION_PREFERENCES",
                            saved.getId(),
                            "USER_NOTIFICATION_PREFERENCES_UPDATED",
                            "User study notification preferences updated for study " + study.getName(),
                            "API",
                            List.of(
                                    new AuditEntitySnapshot(
                                            "USER_STUDY_NOTIFICATION_PREFERENCES",
                                            saved.getId(),
                                            before,
                                            after
                                    )
                            )
                    )
            );
        }

        OffsetDateTime now = OffsetDateTime.now();
        StudyNotificationPreferenceDto dto = new StudyNotificationPreferenceDto();
        dto.setStudyId(studyId);
        dto.setStudyName(study.getName());
        dto.setStudyCode(study.getStudyCode());
        dto.setStudyRole(member.getStudyRole() != null ? member.getStudyRole() : "Coordinator");
        dto.setAccessRole(resolveStudyAccessRole(tenantId, userId, studyId, now));
        dto.setDailyDigest(saved.isDailyDigest());
        dto.setTaskEmails(saved.isTaskEmails());
        dto.setParticipantEmails(saved.isParticipantEmails());
        dto.setSurveySubmissions(saved.isSurveySubmissions());

        return dto;
    }

    private Map<String, Object> snapshotPreferences(UserStudyNotificationPreference pref) {
        Map<String, Object> map = new HashMap<>();
        if (pref.getId() != null) {
            map.put("dailyDigest", pref.isDailyDigest());
            map.put("taskEmails", pref.isTaskEmails());
            map.put("participantEmails", pref.isParticipantEmails());
            map.put("surveySubmissions", pref.isSurveySubmissions());
        }
        return map;
    }
}
