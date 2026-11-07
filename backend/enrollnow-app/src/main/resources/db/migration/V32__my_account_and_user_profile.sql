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
