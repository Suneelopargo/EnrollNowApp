-- EnrollNow Phase 1
-- V32: My Account, User Profile Enhancements, Notification Preferences, and Login Activities

SET search_path TO enrollnow, public;

-- ============================================================
-- 1. USERS TABLE ENHANCEMENTS
-- ============================================================

ALTER TABLE enrollnow.users
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS ignore_timezone_mismatch BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE enrollnow.users
    ALTER COLUMN profile_photo_url TYPE TEXT;

-- ============================================================
-- 2. USER ACTION TOKENS - EXTEND TOKEN TYPE CHECK CONSTRAINT
-- ============================================================

ALTER TABLE enrollnow.user_action_tokens
    DROP CONSTRAINT IF EXISTS ck_user_action_token_type;

ALTER TABLE enrollnow.user_action_tokens
    ADD CONSTRAINT ck_user_action_token_type
    CHECK (token_type IN ('PASSWORD_RESET', 'ENROLLMENT', 'EMAIL_VERIFICATION'));

-- ============================================================
-- 3. USER STUDY NOTIFICATION PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollnow.user_study_notification_preferences (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    user_id                 UUID NOT NULL,
    study_id                UUID NOT NULL,

    daily_digest            BOOLEAN NOT NULL DEFAULT FALSE,
    task_emails             BOOLEAN NOT NULL DEFAULT FALSE,
    participant_emails      BOOLEAN NOT NULL DEFAULT FALSE,
    survey_submissions      BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_user_study_notif_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES enrollnow.tenants(id),

    CONSTRAINT fk_user_study_notif_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES enrollnow.users(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_study_notif_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES enrollnow.studies(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_user_study_notif_tenant_user_study
        UNIQUE (tenant_id, user_id, study_id)
);

CREATE INDEX IF NOT EXISTS ix_user_study_notif_user
    ON enrollnow.user_study_notification_preferences (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS ix_user_study_notif_study
    ON enrollnow.user_study_notification_preferences (tenant_id, study_id);

-- ============================================================
-- 4. USER LOGIN ACTIVITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollnow.user_login_activities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    user_id             UUID NOT NULL,
    session_id          UUID,

    login_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address          VARCHAR(100),
    user_agent          TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_user_login_activity_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES enrollnow.tenants(id),

    CONSTRAINT fk_user_login_activity_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES enrollnow.users(tenant_id, id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_user_login_activity_user_date
    ON enrollnow.user_login_activities (tenant_id, user_id, login_at DESC);

-- ============================================================
-- 5. QUARTZ SCHEDULER TABLES (POSTGRESQL CLUSTERED / JDBC JOBSTORE)
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_job_details
(
    sched_name VARCHAR(120) NOT NULL,
    job_name  VARCHAR(200) NOT NULL,
    job_group VARCHAR(200) NOT NULL,
    description VARCHAR(250) NULL,
    job_class_name   VARCHAR(250) NOT NULL,
    is_durable BOOL NOT NULL,
    is_nonconcurrent BOOL NOT NULL,
    is_update_data BOOL NOT NULL,
    requests_recovery BOOL NOT NULL,
    job_data BYTEA NULL,
    PRIMARY KEY (sched_name,job_name,job_group)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_triggers
(
    sched_name VARCHAR(120) NOT NULL,
    trigger_name VARCHAR(200) NOT NULL,
    trigger_group VARCHAR(200) NOT NULL,
    job_name  VARCHAR(200) NOT NULL,
    job_group VARCHAR(200) NOT NULL,
    description VARCHAR(250) NULL,
    next_fire_time BIGINT NULL,
    prev_fire_time BIGINT NULL,
    priority INTEGER NULL,
    trigger_state VARCHAR(16) NOT NULL,
    trigger_type VARCHAR(8) NOT NULL,
    start_time BIGINT NOT NULL,
    end_time BIGINT NULL,
    calendar_name VARCHAR(200) NULL,
    misfire_instr SMALLINT NULL,
    job_data BYTEA NULL,
    PRIMARY KEY (sched_name,trigger_name,trigger_group),
    FOREIGN KEY (sched_name,job_name,job_group)
        REFERENCES enrollnow.qrtz_job_details(sched_name,job_name,job_group)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_simple_triggers
(
    sched_name VARCHAR(120) NOT NULL,
    trigger_name VARCHAR(200) NOT NULL,
    trigger_group VARCHAR(200) NOT NULL,
    repeat_count BIGINT NOT NULL,
    repeat_interval BIGINT NOT NULL,
    times_triggered BIGINT NOT NULL,
    PRIMARY KEY (sched_name,trigger_name,trigger_group),
    FOREIGN KEY (sched_name,trigger_name,trigger_group)
        REFERENCES enrollnow.qrtz_triggers(sched_name,trigger_name,trigger_group)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_cron_triggers
(
    sched_name VARCHAR(120) NOT NULL,
    trigger_name VARCHAR(200) NOT NULL,
    trigger_group VARCHAR(200) NOT NULL,
    cron_expression VARCHAR(120) NOT NULL,
    time_zone_id VARCHAR(80),
    PRIMARY KEY (sched_name,trigger_name,trigger_group),
    FOREIGN KEY (sched_name,trigger_name,trigger_group)
        REFERENCES enrollnow.qrtz_triggers(sched_name,trigger_name,trigger_group)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_simprop_triggers
(
    sched_name VARCHAR(120) NOT NULL,
    trigger_name VARCHAR(200) NOT NULL,
    trigger_group VARCHAR(200) NOT NULL,
    str_prop_1 VARCHAR(512) NULL,
    str_prop_2 VARCHAR(512) NULL,
    str_prop_3 VARCHAR(512) NULL,
    int_prop_1 INT NULL,
    int_prop_2 INT NULL,
    long_prop_1 BIGINT NULL,
    long_prop_2 BIGINT NULL,
    dec_prop_1 NUMERIC(13,4) NULL,
    dec_prop_2 NUMERIC(13,4) NULL,
    bool_prop_1 BOOL NULL,
    bool_prop_2 BOOL NULL,
    PRIMARY KEY (sched_name,trigger_name,trigger_group),
    FOREIGN KEY (sched_name,trigger_name,trigger_group)
        REFERENCES enrollnow.qrtz_triggers(sched_name,trigger_name,trigger_group)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_blob_triggers
(
    sched_name VARCHAR(120) NOT NULL,
    trigger_name VARCHAR(200) NOT NULL,
    trigger_group VARCHAR(200) NOT NULL,
    blob_data BYTEA NULL,
    PRIMARY KEY (sched_name,trigger_name,trigger_group),
    FOREIGN KEY (sched_name,trigger_name,trigger_group)
        REFERENCES enrollnow.qrtz_triggers(sched_name,trigger_name,trigger_group)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_calendars
(
    sched_name VARCHAR(120) NOT NULL,
    calendar_name  VARCHAR(200) NOT NULL,
    calendar BYTEA NOT NULL,
    PRIMARY KEY (sched_name,calendar_name)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_paused_trigger_grps
(
    sched_name VARCHAR(120) NOT NULL,
    trigger_group  VARCHAR(200) NOT NULL,
    PRIMARY KEY (sched_name,trigger_group)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_fired_triggers
(
    sched_name VARCHAR(120) NOT NULL,
    entry_id VARCHAR(95) NOT NULL,
    trigger_name VARCHAR(200) NOT NULL,
    trigger_group VARCHAR(200) NOT NULL,
    instance_name VARCHAR(200) NOT NULL,
    fired_time BIGINT NOT NULL,
    sched_time BIGINT NOT NULL,
    priority INTEGER NOT NULL,
    state VARCHAR(16) NOT NULL,
    job_name VARCHAR(200) NULL,
    job_group VARCHAR(200) NULL,
    is_nonconcurrent BOOL NULL,
    requests_recovery BOOL NULL,
    PRIMARY KEY (sched_name,entry_id)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_scheduler_state
(
    sched_name VARCHAR(120) NOT NULL,
    instance_name VARCHAR(200) NOT NULL,
    last_checkin_time BIGINT NOT NULL,
    checkin_interval BIGINT NOT NULL,
    PRIMARY KEY (sched_name,instance_name)
);

CREATE TABLE IF NOT EXISTS enrollnow.qrtz_locks
(
    sched_name VARCHAR(120) NOT NULL,
    lock_name  VARCHAR(40) NOT NULL,
    PRIMARY KEY (sched_name,lock_name)
);

CREATE INDEX IF NOT EXISTS idx_qrtz_j_req_recovery ON enrollnow.qrtz_job_details(sched_name,requests_recovery);
CREATE INDEX IF NOT EXISTS idx_qrtz_j_grp ON enrollnow.qrtz_job_details(sched_name,job_group);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_j ON enrollnow.qrtz_triggers(sched_name,job_name,job_group);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_jg ON enrollnow.qrtz_triggers(sched_name,job_group);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_c ON enrollnow.qrtz_triggers(sched_name,calendar_name);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_g ON enrollnow.qrtz_triggers(sched_name,trigger_group);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_state ON enrollnow.qrtz_triggers(sched_name,trigger_state);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_n_state ON enrollnow.qrtz_triggers(sched_name,trigger_name,trigger_group,trigger_state);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_n_g_state ON enrollnow.qrtz_triggers(sched_name,trigger_group,trigger_state);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_next_fire_time ON enrollnow.qrtz_triggers(sched_name,next_fire_time);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_nft_st ON enrollnow.qrtz_triggers(sched_name,trigger_state,next_fire_time);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_nft_misfire ON enrollnow.qrtz_triggers(sched_name,misfire_instr,next_fire_time);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_nft_st_misfire ON enrollnow.qrtz_triggers(sched_name,misfire_instr,next_fire_time,trigger_state);
CREATE INDEX IF NOT EXISTS idx_qrtz_t_nft_st_misfire_grp ON enrollnow.qrtz_triggers(sched_name,misfire_instr,next_fire_time,trigger_group,trigger_state);
CREATE INDEX IF NOT EXISTS idx_qrtz_ft_trig_inst_name ON enrollnow.qrtz_fired_triggers(sched_name,instance_name);
CREATE INDEX IF NOT EXISTS idx_qrtz_ft_inst_job_req_rcvry ON enrollnow.qrtz_fired_triggers(sched_name,instance_name,requests_recovery);
CREATE INDEX IF NOT EXISTS idx_qrtz_ft_j_g ON enrollnow.qrtz_fired_triggers(sched_name,job_name,job_group);
CREATE INDEX IF NOT EXISTS idx_qrtz_ft_jg ON enrollnow.qrtz_fired_triggers(sched_name,job_group);
CREATE INDEX IF NOT EXISTS idx_qrtz_ft_t_g ON enrollnow.qrtz_fired_triggers(sched_name,trigger_name,trigger_group);
CREATE INDEX IF NOT EXISTS idx_qrtz_ft_tg ON enrollnow.qrtz_fired_triggers(sched_name,trigger_group);

-- ============================================================
-- 6. OUTBOX OPTIMIZATION INDEXES FOR CONCURRENT PROCESSING & RECOVERY
-- ============================================================

CREATE INDEX IF NOT EXISTS ix_outbox_events_status_locked
    ON enrollnow.outbox_events (status, locked_at)
    WHERE status = 'PROCESSING';

-- ============================================================
-- 7. OUTBOX EVENT RECIPIENTS (CRASH-RESILIENT DELIVERY TRACKING)
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollnow.outbox_event_recipients (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    outbox_event_id         UUID NOT NULL REFERENCES enrollnow.outbox_events(id) ON DELETE CASCADE,
    recipient_email         VARCHAR(255) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    delivered_at            TIMESTAMPTZ,
    last_error              TEXT,
    attempt_count           INTEGER NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_outbox_event_recipient_delivery
        UNIQUE (tenant_id, outbox_event_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS ix_outbox_event_recipients_event
    ON enrollnow.outbox_event_recipients (tenant_id, outbox_event_id, status);


