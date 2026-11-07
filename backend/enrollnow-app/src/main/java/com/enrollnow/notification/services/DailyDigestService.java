package com.enrollnow.notification.services;

import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.models.UserStudyNotificationPreference;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import com.enrollnow.identity.repositories.UserStudyNotificationPreferenceRepository;
import com.enrollnow.identity.services.DailyDigestTriggerService;
import com.enrollnow.notification.models.CalendarEventEntity;
import com.enrollnow.notification.models.TaskEntity;
import com.enrollnow.notification.repositories.CalendarEventEntityRepository;
import com.enrollnow.notification.repositories.TaskAssignmentEntityRepository;
import com.enrollnow.notification.repositories.TaskEntityRepository;
import com.enrollnow.notification.templates.NotificationHtmlRenderer;
import com.enrollnow.notification.templates.NotificationTemplateCatalog;
import com.enrollnow.participant.models.Participant;
import com.enrollnow.participant.repositories.ParticipantRepository;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DailyDigestService implements DailyDigestTriggerService {

    private static final Logger log = LoggerFactory.getLogger(DailyDigestService.class);
    private static final int TASK_EVENT_LIMIT = 100;

    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final UserStudyNotificationPreferenceRepository notificationPreferenceRepository;
    private final StudyRepository studyRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final TaskEntityRepository taskEntityRepository;
    private final TaskAssignmentEntityRepository taskAssignmentEntityRepository;
    private final CalendarEventEntityRepository calendarEventEntityRepository;
    private final ParticipantRepository participantRepository;
    private final NotificationEmailDeliveryService emailDeliveryService;
    private final NotificationHtmlRenderer htmlRenderer;

    @Value("${app.frontend.activation-url:http://localhost:3000}")
    private String rootUrl;

    @Autowired
    public DailyDigestService(
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            UserStudyNotificationPreferenceRepository notificationPreferenceRepository,
            StudyRepository studyRepository,
            StudyMemberRepository studyMemberRepository,
            TaskEntityRepository taskEntityRepository,
            TaskAssignmentEntityRepository taskAssignmentEntityRepository,
            CalendarEventEntityRepository calendarEventEntityRepository,
            @Autowired(required = false) ParticipantRepository participantRepository,
            NotificationEmailDeliveryService emailDeliveryService,
            NotificationHtmlRenderer htmlRenderer) {
        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.studyRepository = studyRepository;
        this.studyMemberRepository = studyMemberRepository;
        this.taskEntityRepository = taskEntityRepository;
        this.taskAssignmentEntityRepository = taskAssignmentEntityRepository;
        this.calendarEventEntityRepository = calendarEventEntityRepository;
        this.participantRepository = participantRepository;
        this.emailDeliveryService = emailDeliveryService;
        this.htmlRenderer = htmlRenderer;
    }

    @Override
    @Transactional(readOnly = true)
    public void triggerDailyDigest(UUID tenantId, UUID userId) {
        log.info("Executing immediate Daily Digest generation for tenant: {}, user: {}", tenantId, userId);
        Optional<User> userOpt = userRepository.findByTenantIdAndId(tenantId, userId);
        if (userOpt.isEmpty()) {
            log.warn("Cannot generate daily digest: user {} not found in tenant {}", userId, tenantId);
            return;
        }

        User user = userOpt.get();
        if (isUserLocked(tenantId, userId)) {
            log.info("Skipping daily digest for locked user {}", userId);
            return;
        }

        List<StudyMember> memberships = studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId);
        for (StudyMember member : memberships) {
            UUID studyId = member.getId().getStudyId();
            Optional<Study> studyOpt = studyRepository.findByTenantIdAndId(tenantId, studyId);
            if (studyOpt.isEmpty() || studyOpt.get().isArchived()) {
                continue;
            }
            generateAndSendDigestForUserInStudy(tenantId, user, studyOpt.get(), member, true);
        }
    }

    @Transactional(readOnly = true)
    public void generateAndSendAllDailyDigests() {
        log.info("Starting scheduled Daily Digest execution for all active studies and subscribed members");
        List<Study> allStudies = studyRepository.findAll();
        for (Study study : allStudies) {
            if (study.isArchived()) {
                continue;
            }

            UUID tenantId = study.getTenantId();
            UUID studyId = study.getId();
            List<StudyMember> members = studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)
                    .stream().filter(StudyMember::isActive).toList();

            for (StudyMember member : members) {
                UUID userId = member.getId().getUserId();
                Optional<UserStudyNotificationPreference> prefOpt =
                        notificationPreferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, userId, studyId);

                if (prefOpt.isEmpty() || !prefOpt.get().isDailyDigest()) {
                    continue;
                }

                if (isUserLocked(tenantId, userId)) {
                    continue;
                }

                Optional<User> userOpt = userRepository.findByTenantIdAndId(tenantId, userId);
                if (userOpt.isEmpty()) {
                    continue;
                }

                generateAndSendDigestForUserInStudy(tenantId, userOpt.get(), study, member, false);
            }
        }
    }

    private void generateAndSendDigestForUserInStudy(
            UUID tenantId,
            User user,
            Study study,
            StudyMember member,
            boolean forceSend) {

        ZoneId userZone = resolveZoneId(user.getTimezone());
        ZonedDateTime nowInUserZone = ZonedDateTime.now(userZone);

        // Date boundaries according to legacy Ripple:
        // Yesterday end of day
        Instant yesterdayEndOfDay = nowInUserZone.minusDays(1).with(LocalTime.MAX).toInstant();
        // Today start and end of day
        Instant todayStartOfDay = nowInUserZone.with(LocalTime.MIN).toInstant();
        Instant todayEndOfDay = nowInUserZone.with(LocalTime.MAX).toInstant();
        // Tomorrow start and end of day
        Instant tomorrowStartOfDay = nowInUserZone.plusDays(1).with(LocalTime.MIN).toInstant();
        Instant tomorrowEndOfDay = nowInUserZone.plusDays(1).with(LocalTime.MAX).toInstant();
        // Expected events: next 2 weeks
        Instant twoWeeksHorizon = nowInUserZone.plusWeeks(2).with(LocalTime.MAX).toInstant();

        boolean isAdminOrLeader = isUserAdminOrLeader(member);
        Set<UUID> assignedTaskIds = isAdminOrLeader ? Collections.emptySet() :
                new HashSet<>(taskAssignmentEntityRepository.findTaskIdsAssignedToUser(tenantId, user.getId()));

        // 1. Overdue tasks
        List<TaskEntity> overdueRaw = taskEntityRepository.findOverdueTasks(tenantId, study.getId(), yesterdayEndOfDay);
        List<TaskEntity> overdueFiltered = filterTasks(overdueRaw, isAdminOrLeader, assignedTaskIds, user.getId());

        // 2. Tasks due today
        List<TaskEntity> todayRaw = taskEntityRepository.findTasksDueBetween(tenantId, study.getId(), todayStartOfDay, todayEndOfDay);
        List<TaskEntity> todayFiltered = filterTasks(todayRaw, isAdminOrLeader, assignedTaskIds, user.getId());

        // 3. Tasks due tomorrow
        List<TaskEntity> tomorrowRaw = taskEntityRepository.findTasksDueBetween(tenantId, study.getId(), tomorrowStartOfDay, tomorrowEndOfDay);
        List<TaskEntity> tomorrowFiltered = filterTasks(tomorrowRaw, isAdminOrLeader, assignedTaskIds, user.getId());

        // 4. Overdue events
        List<CalendarEventEntity> overdueEventsRaw = calendarEventEntityRepository.findOverdueEvents(tenantId, study.getId(), yesterdayEndOfDay);
        List<CalendarEventEntity> overdueEventsFiltered = filterEvents(overdueEventsRaw, isAdminOrLeader, user.getId());

        // 5. Events today
        List<CalendarEventEntity> eventsTodayRaw = calendarEventEntityRepository.findEventsBetween(tenantId, study.getId(), todayStartOfDay, todayEndOfDay);
        List<CalendarEventEntity> eventsTodayFiltered = filterEvents(eventsTodayRaw, isAdminOrLeader, user.getId());

        // 6. Events tomorrow
        List<CalendarEventEntity> eventsTomorrowRaw = calendarEventEntityRepository.findEventsBetween(tenantId, study.getId(), tomorrowStartOfDay, tomorrowEndOfDay);
        List<CalendarEventEntity> eventsTomorrowFiltered = filterEvents(eventsTomorrowRaw, isAdminOrLeader, user.getId());

        // 7. Expected events
        List<CalendarEventEntity> expectedEventsRaw = calendarEventEntityRepository.findExpectedEvents(tenantId, study.getId(), twoWeeksHorizon);
        List<CalendarEventEntity> expectedEventsFiltered = filterEvents(expectedEventsRaw, isAdminOrLeader, user.getId());

        boolean hasItems = !overdueFiltered.isEmpty() || !todayFiltered.isEmpty() || !tomorrowFiltered.isEmpty() ||
                !overdueEventsFiltered.isEmpty() || !eventsTodayFiltered.isEmpty() || !eventsTomorrowFiltered.isEmpty() ||
                !expectedEventsFiltered.isEmpty();

        if (!hasItems && !forceSend) {
            log.debug("No items for user {} in study {}, skipping scheduled daily digest", user.getId(), study.getName());
            return;
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a z").withZone(userZone);

        Map<String, Object> digestData = new HashMap<>();
        digestData.put("overdueTasks", pruneAndMapTasks(overdueFiltered, formatter, tenantId));
        digestData.put("dueTodayTasks", pruneAndMapTasks(todayFiltered, formatter, tenantId));
        digestData.put("dueTomorrowTasks", pruneAndMapTasks(tomorrowFiltered, formatter, tenantId));
        digestData.put("overdueEvents", pruneAndMapEvents(overdueEventsFiltered, formatter, tenantId));
        digestData.put("eventsToday", pruneAndMapEvents(eventsTodayFiltered, formatter, tenantId));
        digestData.put("eventsTomorrow", pruneAndMapEvents(eventsTomorrowFiltered, formatter, tenantId));
        digestData.put("expectedEvents", pruneAndMapEvents(expectedEventsFiltered, formatter, tenantId));

        String recipientName = (user.getFirstName() != null ? user.getFirstName() : "") + " " +
                (user.getLastName() != null ? user.getLastName() : "").trim();
        if (recipientName.isBlank()) {
            recipientName = "User";
        }

        String recipientEmail = resolvePrimaryEmail(tenantId, user.getId());
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Cannot send Daily Digest: no email found for user {}", user.getId());
            return;
        }

        String subject = "EnrollNow Daily Digest - " + study.getName();
        String htmlBody = htmlRenderer.renderDailyDigestHtml(recipientName, study.getName(), digestData, rootUrl);

        emailDeliveryService.sendEmail(
                tenantId,
                study.getId(),
                null,
                recipientEmail,
                subject,
                htmlBody,
                NotificationTemplateCatalog.DAILY_DIGEST_TEMPLATE_ID
        );
        log.info("Daily Digest successfully dispatched for user {} (study: {})", user.getId(), study.getName());
    }

    private List<Map<String, Object>> pruneAndMapTasks(List<TaskEntity> tasks, DateTimeFormatter formatter, UUID tenantId) {
        int limit = Math.min(tasks.size(), TASK_EVENT_LIMIT);
        List<Map<String, Object>> list = new ArrayList<>(limit);
        for (int i = 0; i < limit; i++) {
            TaskEntity task = tasks.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("name", task.getTitle());
            item.put("dates", task.getDueAt() != null ? formatter.format(task.getDueAt()) : "NA");
            item.put("status", task.getStatus() != null ? task.getStatus() : "OPEN");

            String participantLabel = resolveParticipantLabel(tenantId, task.getParticipantId());
            item.put("pCustomId", participantLabel);
            item.put("pGlobalId", participantLabel);

            List<UUID> assignedUsers = taskAssignmentEntityRepository.findUserIdsAssignedToTask(tenantId, task.getId());
            item.put("assignedTo", formatAssignedUsers(tenantId, assignedUsers));
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> pruneAndMapEvents(List<CalendarEventEntity> events, DateTimeFormatter formatter, UUID tenantId) {
        int limit = Math.min(events.size(), TASK_EVENT_LIMIT);
        List<Map<String, Object>> list = new ArrayList<>(limit);
        for (int i = 0; i < limit; i++) {
            CalendarEventEntity event = events.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("name", event.getTitle());
            item.put("dates", event.getStartAt() != null ? formatter.format(event.getStartAt()) : "NA");
            item.put("status", event.getStatus() != null ? event.getStatus() : "SCHEDULED");

            String participantLabel = resolveParticipantLabel(tenantId, event.getParticipantId());
            item.put("pCustomId", participantLabel);
            item.put("pGlobalId", participantLabel);
            list.add(item);
        }
        return list;
    }

    private List<TaskEntity> filterTasks(List<TaskEntity> tasks, boolean isAdmin, Set<UUID> assignedTaskIds, UUID userId) {
        if (isAdmin) {
            return tasks;
        }
        return tasks.stream()
                .filter(t -> assignedTaskIds.contains(t.getId()) || userId.equals(t.getCreatedByUserId()))
                .toList();
    }

    private List<CalendarEventEntity> filterEvents(List<CalendarEventEntity> events, boolean isAdmin, UUID userId) {
        if (isAdmin) {
            return events;
        }
        return events.stream()
                .filter(e -> userId.equals(e.getCreatedByUserId()))
                .toList();
    }

    private String resolveParticipantLabel(UUID tenantId, UUID participantId) {
        if (participantId == null || participantRepository == null) {
            return "-";
        }
        try {
            Optional<Participant> pOpt = participantRepository.findByTenantIdAndId(tenantId, participantId);
            if (pOpt.isPresent()) {
                Participant p = pOpt.get();
                String name = (p.getFirstName() != null ? p.getFirstName() : "") + " " +
                        (p.getLastName() != null ? p.getLastName() : "").trim();
                return name.isBlank() ? participantId.toString() : name;
            }
        } catch (Exception e) {
            log.debug("Error looking up participant: {}", e.getMessage());
        }
        return participantId.toString();
    }

    private String formatAssignedUsers(UUID tenantId, List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return "Unassigned";
        }
        List<String> names = new ArrayList<>();
        for (UUID uid : userIds) {
            userRepository.findByTenantIdAndId(tenantId, uid).ifPresent(u -> {
                String initials = "";
                if (u.getFirstName() != null && !u.getFirstName().isEmpty()) {
                    initials += u.getFirstName().substring(0, 1).toUpperCase();
                }
                if (u.getLastName() != null && !u.getLastName().isEmpty()) {
                    initials += u.getLastName().substring(0, 1).toUpperCase();
                }
                names.add(initials.isEmpty() ? "U" : initials);
            });
        }
        return names.isEmpty() ? "Assigned" : String.join(", ", names);
    }

    private String resolvePrimaryEmail(UUID tenantId, UUID userId) {
        return userEmailRepository.findByTenantIdAndUserIdAndPrimaryEmailTrue(tenantId, userId)
                .map(UserEmail::getEmail)
                .orElseGet(() -> userEmailRepository.findByTenantIdAndUserId(tenantId, userId)
                        .stream().findFirst().map(UserEmail::getEmail).orElse(null));
    }

    private boolean isUserLocked(UUID tenantId, UUID userId) {
        Optional<UserSecurityState> stateOpt = userSecurityStateRepository.findByTenantIdAndUserId(tenantId, userId);
        return stateOpt.isPresent() && stateOpt.get().getLockedAt() != null;
    }

    private boolean isUserAdminOrLeader(StudyMember member) {
        String role = member.getStudyRole();
        if (role == null) {
            return false;
        }
        String upper = role.toUpperCase();
        return upper.contains("ADMIN") || upper.contains("LEAD") || upper.contains("PI") || upper.contains("DIRECTOR");
    }

    private ZoneId resolveZoneId(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return ZoneId.of("UTC");
        }
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return ZoneId.of("UTC");
        }
    }
}
