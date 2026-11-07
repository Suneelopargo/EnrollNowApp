package com.enrollnow.notification.services;

import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.models.UserStudyNotificationPreference;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import com.enrollnow.identity.repositories.UserStudyNotificationPreferenceRepository;
import com.enrollnow.notification.models.CalendarEventEntity;
import com.enrollnow.notification.models.TaskEntity;
import com.enrollnow.notification.repositories.CalendarEventEntityRepository;
import com.enrollnow.notification.repositories.TaskAssignmentEntityRepository;
import com.enrollnow.notification.repositories.TaskEntityRepository;
import com.enrollnow.notification.templates.NotificationHtmlRenderer;
import com.enrollnow.notification.templates.NotificationTemplateCatalog;
import com.enrollnow.participant.repositories.ParticipantRepository;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyDigestServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserEmailRepository userEmailRepository;
    @Mock
    private UserSecurityStateRepository userSecurityStateRepository;
    @Mock
    private UserStudyNotificationPreferenceRepository notificationPreferenceRepository;
    @Mock
    private StudyRepository studyRepository;
    @Mock
    private StudyMemberRepository studyMemberRepository;
    @Mock
    private TaskEntityRepository taskEntityRepository;
    @Mock
    private TaskAssignmentEntityRepository taskAssignmentEntityRepository;
    @Mock
    private CalendarEventEntityRepository calendarEventEntityRepository;
    @Mock
    private ParticipantRepository participantRepository;
    @Mock
    private NotificationEmailDeliveryService emailDeliveryService;

    private NotificationHtmlRenderer htmlRenderer;
    private DailyDigestService dailyDigestService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        htmlRenderer = new NotificationHtmlRenderer();
        dailyDigestService = new DailyDigestService(
                userRepository,
                userEmailRepository,
                userSecurityStateRepository,
                notificationPreferenceRepository,
                studyRepository,
                studyMemberRepository,
                taskEntityRepository,
                taskAssignmentEntityRepository,
                calendarEventEntityRepository,
                participantRepository,
                emailDeliveryService,
                htmlRenderer
        );
    }

    @Test
    void testTriggerDailyDigest_Success() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setTimezone("America/New_York");

        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(new UserSecurityState()));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setActive(true);
        member.setStudyRole("Study Admin");
        when(studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId)).thenReturn(List.of(member));

        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Cardio Study");
        study.setArchived(false);
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        UserEmail email = new UserEmail();
        email.setEmail("jane.doe@example.com");
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, userId)).thenReturn(Optional.of(email));

        TaskEntity task = new TaskEntity();
        task.setId(UUID.randomUUID());
        task.setTitle("Prepare visit documentation");
        task.setDueAt(Instant.now().minusSeconds(86400));
        task.setStatus("OPEN");
        when(taskEntityRepository.findOverdueTasks(eq(tenantId), eq(studyId), any())).thenReturn(List.of(task));

        CalendarEventEntity event = new CalendarEventEntity();
        event.setId(UUID.randomUUID());
        event.setTitle("Screening Visit");
        event.setStartAt(Instant.now().plusSeconds(3600));
        event.setStatus("SCHEDULED");
        when(calendarEventEntityRepository.findEventsBetween(eq(tenantId), eq(studyId), any(), any())).thenReturn(List.of(event));

        dailyDigestService.triggerDailyDigest(tenantId, userId);

        verify(emailDeliveryService, times(1)).sendEmail(
                eq(tenantId),
                eq(studyId),
                isNull(),
                eq("jane.doe@example.com"),
                contains("Cardio Study"),
                contains("Prepare visit documentation"),
                eq(NotificationTemplateCatalog.DAILY_DIGEST_TEMPLATE_ID)
        );
    }

    @Test
    void testTriggerDailyDigest_UserLocked_Skipped() {
        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));

        UserSecurityState state = new UserSecurityState();
        state.setLockedAt(OffsetDateTime.now());
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(state));

        dailyDigestService.triggerDailyDigest(tenantId, userId);

        verifyNoInteractions(studyMemberRepository);
        verifyNoInteractions(emailDeliveryService);
    }

    @Test
    void testGenerateAndSendAllDailyDigests_SubscribedMember() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Oncology Protocol");
        study.setArchived(false);
        when(studyRepository.findAll()).thenReturn(List.of(study));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setActive(true);
        member.setStudyRole("Coordinator");
        when(studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)).thenReturn(List.of(member));

        UserStudyNotificationPreference pref = new UserStudyNotificationPreference();
        pref.setDailyDigest(true);
        when(notificationPreferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, userId, studyId)).thenReturn(Optional.of(pref));
        when(userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(new UserSecurityState()));

        User user = new User();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("Bob");
        user.setLastName("Smith");
        user.setTimezone("UTC");
        when(userRepository.findByTenantIdAndId(tenantId, userId)).thenReturn(Optional.of(user));

        UserEmail email = new UserEmail();
        email.setEmail("bob.smith@example.com");
        when(userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, userId)).thenReturn(Optional.of(email));

        TaskEntity task = new TaskEntity();
        task.setId(UUID.randomUUID());
        task.setTitle("Follow up call");
        task.setDueAt(Instant.now());
        task.setStatus("OPEN");
        when(taskEntityRepository.findTasksDueBetween(eq(tenantId), eq(studyId), any(), any())).thenReturn(List.of(task));
        when(taskAssignmentEntityRepository.findTaskIdsAssignedToUser(tenantId, userId)).thenReturn(List.of(task.getId()));

        dailyDigestService.generateAndSendAllDailyDigests();

        verify(emailDeliveryService, times(1)).sendEmail(
                eq(tenantId),
                eq(studyId),
                isNull(),
                eq("bob.smith@example.com"),
                contains("Oncology Protocol"),
                contains("Follow up call"),
                eq(NotificationTemplateCatalog.DAILY_DIGEST_TEMPLATE_ID)
        );
    }

    @Test
    void testGenerateAndSendAllDailyDigests_PreferenceFalse_Skipped() {
        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setName("Genetics Study");
        study.setArchived(false);
        when(studyRepository.findAll()).thenReturn(List.of(study));

        StudyMember member = new StudyMember();
        member.setId(new StudyMemberId(studyId, userId));
        member.setActive(true);
        when(studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)).thenReturn(List.of(member));

        UserStudyNotificationPreference pref = new UserStudyNotificationPreference();
        pref.setDailyDigest(false);
        when(notificationPreferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, userId, studyId)).thenReturn(Optional.of(pref));

        dailyDigestService.generateAndSendAllDailyDigests();

        verifyNoInteractions(emailDeliveryService);
    }
}
