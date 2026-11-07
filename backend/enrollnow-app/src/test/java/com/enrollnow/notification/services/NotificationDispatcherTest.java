package com.enrollnow.notification.services;

import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.models.UserStudyNotificationPreference;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import com.enrollnow.identity.repositories.UserStudyNotificationPreferenceRepository;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.templates.NotificationHtmlRenderer;
import com.enrollnow.notification.templates.NotificationTemplateCatalog;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDispatcherTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserEmailRepository userEmailRepository;
    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;
    @Mock
    private UserStudyNotificationPreferenceRepository preferenceRepository;
    @Mock
    private StudyRepository studyRepository;
    @Mock
    private StudyMemberRepository studyMemberRepository;
    @Mock
    private NotificationEmailDeliveryService emailDeliveryService;

    private NotificationDispatcher dispatcher;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID tenantId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final UUID recipientUserId = UUID.randomUUID();
    private final UUID actorUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        NotificationHtmlRenderer htmlRenderer = new NotificationHtmlRenderer();
        dispatcher = new NotificationDispatcher(
                userRepository,
                userEmailRepository,
                userSecurityStateRepository,
                preferenceRepository,
                studyRepository,
                studyMemberRepository,
                emailDeliveryService,
                htmlRenderer,
                objectMapper
        );
    }

    @Test
    void testTaskCreated_NotifiesAssignedUser_ExcludesActor() throws Exception {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Vaccine Trial");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        User recipient = new User();
        recipient.setId(recipientUserId);
        recipient.setFirstName("Alice");
        recipient.setLastName("Wonder");
        when(userRepository.findByTenantIdAndId(tenantId, recipientUserId)).thenReturn(Optional.of(recipient));

        UserEmail email = new UserEmail();
        email.setEmail("alice@example.com");
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, recipientUserId)).thenReturn(Optional.of(email));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, recipientUserId)).thenReturn(Optional.of(new UserSecurityState()));

        UserStudyNotificationPreference pref = new UserStudyNotificationPreference();
        pref.setTaskEmails(true);
        when(preferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, recipientUserId, studyId)).thenReturn(Optional.of(pref));

        Map<String, Object> payload = new HashMap<>();
        payload.put("studyId", studyId.toString());
        payload.put("actorUserId", actorUserId.toString());
        payload.put("assignedTo", List.of(recipientUserId.toString(), actorUserId.toString()));
        payload.put("title", "Review Lab Results");
        payload.put("dueDate", "2026-11-15");

        OutboxEventEntity event = new OutboxEventEntity();
        event.setTenantId(tenantId);
        event.setEventType(NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED);
        event.setPayload(objectMapper.writeValueAsString(payload));

        dispatcher.dispatch(event);

        // Verify recipient was emailed, actor was excluded
        verify(emailDeliveryService, times(1)).sendEmail(
                eq(tenantId),
                eq(studyId),
                isNull(),
                eq("alice@example.com"),
                contains("Review Lab Results"),
                contains("Vaccine Trial"),
                eq(NotificationTemplateCatalog.TASK_CREATED_TEMPLATE_ID)
        );
    }

    @Test
    void testParticipantConsentAdded_NotifiesSubscribedMembers() throws Exception {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Neuro Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, recipientUserId));
        member.setActive(true);
        when(studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)).thenReturn(List.of(member));

        User recipient = new User();
        recipient.setId(recipientUserId);
        recipient.setFirstName("Bob");
        recipient.setLastName("Builder");
        when(userRepository.findByTenantIdAndId(tenantId, recipientUserId)).thenReturn(Optional.of(recipient));

        UserEmail email = new UserEmail();
        email.setEmail("bob@example.com");
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, recipientUserId)).thenReturn(Optional.of(email));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, recipientUserId)).thenReturn(Optional.of(new UserSecurityState()));

        UserStudyNotificationPreference pref = new UserStudyNotificationPreference();
        pref.setParticipantEmails(true);
        when(preferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, recipientUserId, studyId)).thenReturn(Optional.of(pref));

        Map<String, Object> payload = new HashMap<>();
        payload.put("studyId", studyId.toString());
        payload.put("actorUserId", actorUserId.toString());
        payload.put("consentAuthor", "Dr. Smith");

        OutboxEventEntity event = new OutboxEventEntity();
        event.setTenantId(tenantId);
        event.setEventType(NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_CONSENT_ADDED);
        event.setPayload(objectMapper.writeValueAsString(payload));

        dispatcher.dispatch(event);

        verify(emailDeliveryService, times(1)).sendEmail(
                eq(tenantId),
                eq(studyId),
                isNull(),
                eq("bob@example.com"),
                contains("Participant Consent Recorded"),
                contains("Neuro Study"),
                eq(NotificationTemplateCatalog.PARTICIPANT_CONSENT_ADDED_TEMPLATE_ID)
        );
    }

    @Test
    void testSurveySubmission_NotifiesSubscribedMembers() throws Exception {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Diabetes Survey Project");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, recipientUserId));
        member.setActive(true);
        when(studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)).thenReturn(List.of(member));

        User recipient = new User();
        recipient.setId(recipientUserId);
        recipient.setFirstName("Charlie");
        recipient.setLastName("Brown");
        when(userRepository.findByTenantIdAndId(tenantId, recipientUserId)).thenReturn(Optional.of(recipient));

        UserEmail email = new UserEmail();
        email.setEmail("charlie@example.com");
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, recipientUserId)).thenReturn(Optional.of(email));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, recipientUserId)).thenReturn(Optional.of(new UserSecurityState()));

        UserStudyNotificationPreference pref = new UserStudyNotificationPreference();
        pref.setSurveySubmissions(true);
        when(preferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, recipientUserId, studyId)).thenReturn(Optional.of(pref));

        Map<String, Object> payload = new HashMap<>();
        payload.put("studyId", studyId.toString());
        payload.put("surveyName", "Baseline Intake Survey");

        OutboxEventEntity event = new OutboxEventEntity();
        event.setTenantId(tenantId);
        event.setEventType(NotificationTemplateCatalog.EVENT_TYPE_SURVEY_SUBMISSION_COMPLETED);
        event.setPayload(objectMapper.writeValueAsString(payload));

        dispatcher.dispatch(event);

        verify(emailDeliveryService, times(1)).sendEmail(
                eq(tenantId),
                eq(studyId),
                isNull(),
                eq("charlie@example.com"),
                contains("Baseline Intake Survey"),
                contains("Diabetes Survey Project"),
                eq(NotificationTemplateCatalog.SURVEY_SUBMISSION_CONFIRM_TEMPLATE_ID)
        );
    }

    @Test
    void testPreferenceDisabled_NoEmailSent() throws Exception {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Sleep Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UserStudyNotificationPreference pref = new UserStudyNotificationPreference();
        pref.setTaskEmails(false); // Task emails turned OFF
        when(preferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, recipientUserId, studyId)).thenReturn(Optional.of(pref));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, recipientUserId)).thenReturn(Optional.of(new UserSecurityState()));

        Map<String, Object> payload = new HashMap<>();
        payload.put("studyId", studyId.toString());
        payload.put("assignedTo", List.of(recipientUserId.toString()));
        payload.put("title", "Review EEG Log");

        OutboxEventEntity event = new OutboxEventEntity();
        event.setTenantId(tenantId);
        event.setEventType(NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED);
        event.setPayload(objectMapper.writeValueAsString(payload));

        dispatcher.dispatch(event);

        verifyNoInteractions(emailDeliveryService);
    }
}
