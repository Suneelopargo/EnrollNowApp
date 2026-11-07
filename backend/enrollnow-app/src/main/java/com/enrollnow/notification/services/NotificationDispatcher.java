package com.enrollnow.notification.services;

import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.models.UserStudyNotificationPreference;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import com.enrollnow.identity.repositories.UserStudyNotificationPreferenceRepository;
import com.enrollnow.notification.exceptions.NotificationDeliveryException;
import com.enrollnow.notification.models.OutboxEventEntity;
import com.enrollnow.notification.templates.NotificationHtmlRenderer;
import com.enrollnow.notification.templates.NotificationTemplateCatalog;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final UserSecurityStateRepository userSecurityStateRepository;
    private final UserStudyNotificationPreferenceRepository preferenceRepository;
    private final StudyRepository studyRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final NotificationEmailDeliveryService emailDeliveryService;
    private final NotificationHtmlRenderer htmlRenderer;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend.activation-url:http://localhost:3000}")
    private String rootUrl;

    @Autowired
    public NotificationDispatcher(
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            UserSecurityStateRepository userSecurityStateRepository,
            UserStudyNotificationPreferenceRepository preferenceRepository,
            StudyRepository studyRepository,
            StudyMemberRepository studyMemberRepository,
            NotificationEmailDeliveryService emailDeliveryService,
            NotificationHtmlRenderer htmlRenderer,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.userSecurityStateRepository = userSecurityStateRepository;
        this.preferenceRepository = preferenceRepository;
        this.studyRepository = studyRepository;
        this.studyMemberRepository = studyMemberRepository;
        this.emailDeliveryService = emailDeliveryService;
        this.htmlRenderer = htmlRenderer;
        this.objectMapper = objectMapper;
    }

    public void dispatch(OutboxEventEntity event) throws Exception {
        Map<String, Object> payload = objectMapper.readValue(
                event.getPayload(),
                new TypeReference<Map<String, Object>>() {}
        );

        UUID tenantId = event.getTenantId();
        String eventType = event.getEventType();

        log.info("Dispatching outbox notification: {} for tenant {}", eventType, tenantId);

        UUID studyId = payload.get("studyId") != null ? UUID.fromString(String.valueOf(payload.get("studyId"))) : null;
        UUID actorUserId = payload.get("actorUserId") != null ? UUID.fromString(String.valueOf(payload.get("actorUserId"))) : null;
        UUID participantId = payload.get("participantId") != null ? UUID.fromString(String.valueOf(payload.get("participantId"))) : null;

        String studyName = "EnrollNow Study";
        if (studyId != null) {
            Optional<Study> studyOpt = studyRepository.findByTenantIdAndId(tenantId, studyId);
            if (studyOpt.isPresent()) {
                studyName = studyOpt.get().getName();
            }
        }

        switch (eventType) {
            case NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED:
            case NotificationTemplateCatalog.EVENT_TYPE_TASK_COMMENT_ADDED:
            case NotificationTemplateCatalog.EVENT_TYPE_TASK_STATUS_CHANGED:
            case NotificationTemplateCatalog.EVENT_TYPE_TASK_DUE_DATE_CHANGED:
                handleTaskNotification(tenantId, studyId, studyName, actorUserId, participantId, eventType, payload, event);
                break;

            case NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_COMMENT_ADDED:
            case NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_CONSENT_ADDED:
            case NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_STATUS_CHANGED:
            case NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_STICKY_NOTE_ADDED:
            case NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_CONTACT_LOG_ADDED:
            case NotificationTemplateCatalog.EVENT_TYPE_EVENT_STATUS_CHANGED:
                handleParticipantNotification(tenantId, studyId, studyName, actorUserId, participantId, eventType, payload, event);
                break;

            case NotificationTemplateCatalog.EVENT_TYPE_SURVEY_SUBMISSION_COMPLETED:
                handleSurveySubmissionNotification(tenantId, studyId, studyName, actorUserId, participantId, payload, event);
                break;

            default:
                log.error("Unsupported notification outbox event type: {}", eventType);
                throw new IllegalArgumentException("Unsupported notification outbox event type: " + eventType);
        }
    }

    private void handleTaskNotification(
            UUID tenantId,
            UUID studyId,
            String studyName,
            UUID actorUserId,
            UUID participantId,
            String eventType,
            Map<String, Object> payload,
            OutboxEventEntity event) {

        List<UUID> targetUserIds;
        if (payload.containsKey("assignedUserIds")) {
            targetUserIds = extractTargetUserIds(payload, "assignedUserIds");
        } else if (payload.containsKey("assignedTo")) {
            targetUserIds = extractTargetUserIds(payload, "assignedTo");
        } else if (studyId != null) {
            targetUserIds = studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)
                    .stream().filter(StudyMember::isActive).map(m -> m.getId().getUserId()).toList();
        } else {
            targetUserIds = Collections.emptyList();
        }

        String taskTitle = String.valueOf(payload.getOrDefault("taskTitle", payload.getOrDefault("title", payload.getOrDefault("taskName", "Task"))));
        String templateId;
        String subject;
        String message;
        Map<String, String> details = new LinkedHashMap<>();
        details.put("Study", studyName);
        details.put("Task", taskTitle);

        if (NotificationTemplateCatalog.EVENT_TYPE_TASK_CREATED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.TASK_CREATED_TEMPLATE_ID;
            subject = "New Task Created: " + taskTitle;
            message = "A new task has been created and assigned to you in study " + studyName + ".";
            if (payload.get("dueDate") != null) {
                details.put("Due Date", String.valueOf(payload.get("dueDate")));
            }
        } else if (NotificationTemplateCatalog.EVENT_TYPE_TASK_COMMENT_ADDED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.TASK_COMMENT_ADDED_TEMPLATE_ID;
            subject = "Comment Added on Task: " + taskTitle;
            message = "A new comment was added to a task you are watching or assigned to.";
            details.put("Comment", String.valueOf(payload.getOrDefault("comment", "")));
        } else if (NotificationTemplateCatalog.EVENT_TYPE_TASK_STATUS_CHANGED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.TASK_STATUS_CHANGED_TEMPLATE_ID;
            subject = "Task Status Updated: " + taskTitle;
            message = "The status of a task has changed.";
            details.put("New Status", String.valueOf(payload.getOrDefault("newStatus", "")));
        } else {
            templateId = NotificationTemplateCatalog.TASK_DUE_DATE_CHANGED_TEMPLATE_ID;
            subject = "Task Due Date Changed: " + taskTitle;
            message = "The due date for a task has been updated.";
            details.put("New Due Date", String.valueOf(payload.getOrDefault("newDueDate", "")));
        }

        notifyEligibleUsers(
                tenantId,
                studyId,
                participantId,
                targetUserIds,
                actorUserId,
                UserStudyNotificationPreference::isTaskEmails,
                subject,
                message,
                details,
                templateId,
                event
        );
    }

    private void handleParticipantNotification(
            UUID tenantId,
            UUID studyId,
            String studyName,
            UUID actorUserId,
            UUID participantId,
            String eventType,
            Map<String, Object> payload,
            OutboxEventEntity event) {

        if (studyId == null) {
            return;
        }

        List<UUID> studyMembers = studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)
                .stream().filter(StudyMember::isActive).map(m -> m.getId().getUserId()).toList();

        String templateId;
        String subject;
        String message;
        Map<String, String> details = new LinkedHashMap<>();
        details.put("Study", studyName);

        if (NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_COMMENT_ADDED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.PARTICIPANT_COMMENT_ADDED_TEMPLATE_ID;
            subject = "Participant Comment Added - " + studyName;
            message = "A new comment was added for a study participant.";
            details.put("Author", String.valueOf(payload.getOrDefault("commentAuthor", "Team Member")));
            details.put("Comment", String.valueOf(payload.getOrDefault("commentText", "")));
        } else if (NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_CONSENT_ADDED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.PARTICIPANT_CONSENT_ADDED_TEMPLATE_ID;
            subject = "Participant Consent Recorded - " + studyName;
            message = "A new consent record was created for a study participant.";
            details.put("Recorded By", String.valueOf(payload.getOrDefault("consentAuthor", "Team Member")));
        } else if (NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_STATUS_CHANGED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.PARTICIPANT_STATUS_CHANGED_TEMPLATE_ID;
            subject = "Participant Status Changed - " + studyName;
            message = "A study participant status has been updated.";
            details.put("Status", String.valueOf(payload.getOrDefault("newStatus", "")));
        } else if (NotificationTemplateCatalog.EVENT_TYPE_PARTICIPANT_STICKY_NOTE_ADDED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.PARTICIPANT_STICKY_NOTE_ADDED_TEMPLATE_ID;
            subject = "Participant Sticky Note - " + studyName;
            message = "A sticky note was attached to a study participant.";
            details.put("Note", String.valueOf(payload.getOrDefault("noteText", "")));
        } else if (NotificationTemplateCatalog.EVENT_TYPE_EVENT_STATUS_CHANGED.equals(eventType)) {
            templateId = NotificationTemplateCatalog.EVENT_STATUS_CHANGED_TEMPLATE_ID;
            subject = "Event Status Changed - " + studyName;
            message = "A participant calendar event status was updated.";
            details.put("Event", String.valueOf(payload.getOrDefault("eventName", "Event")));
            details.put("Status", String.valueOf(payload.getOrDefault("eventStatus", "")));
        } else {
            templateId = NotificationTemplateCatalog.PARTICIPANT_CONTACT_LOG_ADDED_TEMPLATE_ID;
            subject = "Participant Contact Log Added - " + studyName;
            message = "A new contact log entry was recorded for a participant.";
            details.put("Outcome", String.valueOf(payload.getOrDefault("contactOutcome", "Contact logged")));
        }

        notifyEligibleUsers(
                tenantId,
                studyId,
                participantId,
                studyMembers,
                actorUserId,
                UserStudyNotificationPreference::isParticipantEmails,
                subject,
                message,
                details,
                templateId,
                event
        );
    }

    private void handleSurveySubmissionNotification(
            UUID tenantId,
            UUID studyId,
            String studyName,
            UUID actorUserId,
            UUID participantId,
            Map<String, Object> payload,
            OutboxEventEntity event) {

        if (studyId == null) {
            return;
        }

        List<UUID> studyMembers = studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId)
                .stream().filter(StudyMember::isActive).map(m -> m.getId().getUserId()).toList();

        String surveyTitle = String.valueOf(payload.getOrDefault("surveyName", payload.getOrDefault("surveyTitle", "Survey")));
        String subject = "Survey Submission Received: " + surveyTitle;
        String message = "A participant has completed and submitted a survey for " + studyName + ".";

        Map<String, String> details = new LinkedHashMap<>();
        details.put("Study", studyName);
        details.put("Survey", surveyTitle);

        notifyEligibleUsers(
                tenantId,
                studyId,
                participantId,
                studyMembers,
                actorUserId,
                UserStudyNotificationPreference::isSurveySubmissions,
                subject,
                message,
                details,
                NotificationTemplateCatalog.SURVEY_SUBMISSION_CONFIRM_TEMPLATE_ID,
                event
        );
    }

    private void notifyEligibleUsers(
            UUID tenantId,
            UUID studyId,
            UUID participantId,
            List<UUID> targetUserIds,
            UUID actorUserId,
            java.util.function.Predicate<UserStudyNotificationPreference> preferenceCheck,
            String subject,
            String message,
            Map<String, String> details,
            String templateId,
            OutboxEventEntity event) {

        Set<String> alreadyDelivered = extractDeliveredRecipients(event);
        List<String> failedRecipients = new ArrayList<>();
        boolean updatedDelivered = false;

        for (UUID userId : targetUserIds) {
            // Exclude the user who performed the action (matches legacy: userId !== Meteor.userId())
            if (actorUserId != null && actorUserId.equals(userId)) {
                continue;
            }

            // Check if user is locked
            if (isUserLocked(tenantId, userId)) {
                continue;
            }

            // Check user notification preference for this study
            if (studyId != null) {
                Optional<UserStudyNotificationPreference> prefOpt =
                        preferenceRepository.findByTenantIdAndUserIdAndStudyId(tenantId, userId, studyId);
                if (prefOpt.isEmpty() || !preferenceCheck.test(prefOpt.get())) {
                    continue;
                }
            }

            Optional<User> userOpt = userRepository.findByTenantIdAndId(tenantId, userId);
            if (userOpt.isEmpty()) {
                continue;
            }

            User user = userOpt.get();
            String recipientEmail = resolvePrimaryEmail(tenantId, userId);
            if (recipientEmail == null || recipientEmail.isBlank()) {
                continue;
            }

            // Partial delivery / idempotency check: skip recipients who already received the email
            if (alreadyDelivered.contains(recipientEmail)) {
                log.info("Recipient {} already received email for event {}, skipping duplicate delivery",
                        recipientEmail, event != null ? event.getId() : "null");
                continue;
            }

            String recipientName = (user.getFirstName() != null ? user.getFirstName() : "") + " " +
                    (user.getLastName() != null ? user.getLastName() : "").trim();
            if (recipientName.isBlank()) {
                recipientName = "User";
            }

            String htmlBody = htmlRenderer.renderNotificationHtml(
                    subject,
                    recipientName,
                    message,
                    details,
                    "Open EnrollNow",
                    rootUrl,
                    rootUrl
            );

            boolean sent = emailDeliveryService.sendEmail(
                    tenantId,
                    studyId,
                    participantId,
                    recipientEmail,
                    subject,
                    htmlBody,
                    templateId
            );

            if (sent) {
                alreadyDelivered.add(recipientEmail);
                updatedDelivered = true;
            } else {
                failedRecipients.add(recipientEmail);
            }
        }

        // Persist delivered recipient list back into outbox event metadata so retries do not resend
        if (updatedDelivered && event != null) {
            saveDeliveredRecipientsToMetadata(event, alreadyDelivered);
        }

        if (!failedRecipients.isEmpty()) {
            throw new NotificationDeliveryException("Failed to deliver notification email to: " + String.join(", ", failedRecipients));
        }
    }

    private Set<String> extractDeliveredRecipients(OutboxEventEntity event) {
        if (event == null || event.getMetadata() == null || event.getMetadata().isBlank()) {
            return new HashSet<>();
        }
        try {
            Map<String, Object> meta = objectMapper.readValue(event.getMetadata(), new TypeReference<Map<String, Object>>() {});
            Object delivered = meta.get("deliveredRecipients");
            if (delivered instanceof List<?> list) {
                Set<String> set = new HashSet<>();
                for (Object item : list) {
                    if (item != null) {
                        set.add(String.valueOf(item));
                    }
                }
                return set;
            }
        } catch (Exception ex) {
            log.warn("Could not parse deliveredRecipients from outbox event metadata: {}", ex.getMessage());
        }
        return new HashSet<>();
    }

    private void saveDeliveredRecipientsToMetadata(OutboxEventEntity event, Set<String> delivered) {
        try {
            Map<String, Object> meta;
            if (event.getMetadata() != null && !event.getMetadata().isBlank()) {
                meta = objectMapper.readValue(event.getMetadata(), new TypeReference<Map<String, Object>>() {});
            } else {
                meta = new HashMap<>();
            }
            meta.put("deliveredRecipients", new ArrayList<>(delivered));
            event.setMetadata(objectMapper.writeValueAsString(meta));
        } catch (Exception ex) {
            log.warn("Could not serialize deliveredRecipients to outbox event metadata: {}", ex.getMessage());
        }
    }

    private List<UUID> extractTargetUserIds(Map<String, Object> payload, String key) {
        Object val = payload.get(key);
        if (val instanceof List<?> list) {
            List<UUID> uids = new ArrayList<>();
            for (Object item : list) {
                if (item != null) {
                    try {
                        uids.add(UUID.fromString(String.valueOf(item)));
                    } catch (Exception ignored) {
                    }
                }
            }
            return uids;
        } else if (val instanceof String str && !str.isBlank()) {
            try {
                return List.of(UUID.fromString(str));
            } catch (Exception ignored) {
            }
        }
        return Collections.emptyList();
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
}
