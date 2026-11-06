-- EnrollNow
-- V25: Participant Full Registry Workflow Support
--
-- Adds support for:
--   1. participant_comments (Participant-level and study-level comments with pinning)
--   2. participant_contacts enhancements (contact_name, relationship, can_leave_message, notes, is_preferred)
--   3. communications enhancements (pinned flag for emails and text messages)
--   4. Baseline consent versions and survey definitions for registry workflows

SET search_path TO enrollnow, public;

-- ============================================================
-- 1. PARTICIPANT COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS participant_comments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,
    study_id                UUID,

    text                    TEXT NOT NULL,
    pinned                  BOOLEAN NOT NULL DEFAULT FALSE,
    global                  BOOLEAN NOT NULL DEFAULT TRUE,

    author_id               UUID,
    author_name             VARCHAR(255),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_participant_comments_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_participant_comments_participant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_participant_comments_study
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE SET NULL,

    CONSTRAINT uk_participant_comments_tenant_id
        UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS ix_participant_comments_lookup
    ON participant_comments (
        tenant_id,
        participant_id,
        pinned DESC,
        created_at DESC
    );

CREATE INDEX IF NOT EXISTS ix_participant_comments_study
    ON participant_comments (
        tenant_id,
        study_id
    );

-- ============================================================
-- 2. PARTICIPANT CONTACTS ENHANCEMENTS
-- ============================================================

ALTER TABLE participant_contacts 
    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS relationship VARCHAR(100),
    ADD COLUMN IF NOT EXISTS can_leave_message BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 3. COMMUNICATIONS PINNED FLAG
-- ============================================================

ALTER TABLE communications
    ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS ix_communications_participant_channel
    ON communications (
        tenant_id,
        participant_id,
        channel,
        pinned DESC,
        created_at DESC
    );
