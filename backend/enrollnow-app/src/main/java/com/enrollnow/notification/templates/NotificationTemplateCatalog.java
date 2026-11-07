package com.enrollnow.notification.templates;

/**
 * Authoritative catalog of SendGrid dynamic template IDs and legacy Ripple notification identifiers.
 */
public final class NotificationTemplateCatalog {

    private NotificationTemplateCatalog() {
    }

    // Daily Digest
    public static final String DAILY_DIGEST_TEMPLATE_ID = "d-3b5c5020a6f0463cb13d6298eef58f78";

    // Task Notifications
    public static final String TASK_CREATED_TEMPLATE_ID = "d-a5721f9ac2dc404f8e47649a90e5c8a2";
    public static final String TASK_COMMENT_ADDED_TEMPLATE_ID = "d-e27efb8775fe4a19bee69c78009f78d3";
    public static final String TASK_STATUS_CHANGED_TEMPLATE_ID = "d-a0d34c3fd2884f61b56fbc96abd0834f";
    public static final String TASK_DUE_DATE_CHANGED_TEMPLATE_ID = "d-f26d43ac121c4bf9995a8eb9b86546e1";

    // Calendar Event Notifications
    public static final String EVENT_STATUS_CHANGED_TEMPLATE_ID = "d-5c017a38c5c14998a557118c8ae8694d";

    // Participant Notifications
    public static final String PARTICIPANT_COMMENT_ADDED_TEMPLATE_ID = "d-ce3b73d108a441939773720acb79f866";
    public static final String PARTICIPANT_CONSENT_ADDED_TEMPLATE_ID = "d-c489b1868d0c4910801116fcc00cf04c";
    public static final String PARTICIPANT_STATUS_CHANGED_TEMPLATE_ID = "d-53daa3480fdc4c4d8442c31199578523";
    public static final String PARTICIPANT_STICKY_NOTE_ADDED_TEMPLATE_ID = "99263654-7217-4a05-a308-16030a8cc0ae";
    public static final String PARTICIPANT_CONTACT_LOG_ADDED_TEMPLATE_ID = "d-7abe860f88174e22a505db4bd093140d";
    public static final String PARTICIPANT_EMAIL_ADDED_TEMPLATE_ID = "d-3164066c343741bbb51aa059628bbb29";

    // Survey Notifications
    public static final String SURVEY_SUBMISSION_CONFIRM_TEMPLATE_ID = "d-7998e3088d5c4d8c95d3e64332eaab2c";

    // Outbox Event Types
    public static final String EVENT_TYPE_DAILY_DIGEST = "DAILY_DIGEST";
    public static final String EVENT_TYPE_TASK_CREATED = "TASK_CREATED";
    public static final String EVENT_TYPE_TASK_COMMENT_ADDED = "TASK_COMMENT_ADDED";
    public static final String EVENT_TYPE_TASK_STATUS_CHANGED = "TASK_STATUS_CHANGED";
    public static final String EVENT_TYPE_TASK_DUE_DATE_CHANGED = "TASK_DUE_DATE_CHANGED";
    public static final String EVENT_TYPE_EVENT_STATUS_CHANGED = "EVENT_STATUS_CHANGED";
    public static final String EVENT_TYPE_PARTICIPANT_COMMENT_ADDED = "PARTICIPANT_COMMENT_ADDED";
    public static final String EVENT_TYPE_PARTICIPANT_CONSENT_ADDED = "PARTICIPANT_CONSENT_ADDED";
    public static final String EVENT_TYPE_PARTICIPANT_STATUS_CHANGED = "PARTICIPANT_STATUS_CHANGED";
    public static final String EVENT_TYPE_PARTICIPANT_STICKY_NOTE_ADDED = "PARTICIPANT_STICKY_NOTE_ADDED";
    public static final String EVENT_TYPE_PARTICIPANT_CONTACT_LOG_ADDED = "PARTICIPANT_CONTACT_LOG_ADDED";
    public static final String EVENT_TYPE_PARTICIPANT_EMAIL_LOGGED = "PARTICIPANT_EMAIL_LOGGED";
    public static final String EVENT_TYPE_SURVEY_SUBMISSION_COMPLETED = "SURVEY_SUBMISSION_COMPLETED";
}
