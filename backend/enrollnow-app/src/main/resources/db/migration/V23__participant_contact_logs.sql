-- EnrollNow
-- V24: Participant Contact Logs & Contact Outcomes
--
-- Implements production persistence for participant contact logs and contact outcomes
-- with full legacy Ripple functional parity:
--   - participant_contact_logs: Contact outreach, screening, and communication logs
--   - contact_outcomes: Tenant-scoped contact outcomes
--   - participants.global_last_contact_date: Persisted global last contact date
--
-- All tables are tenant-scoped with tenant-safe composite foreign keys.

SET search_path TO enrollnow, public;

-- ============================================================
-- 1. CONTACT OUTCOMES
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_outcomes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    outcome                 VARCHAR(255) NOT NULL,
    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_contact_outcomes_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_contact_outcomes_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_contact_outcomes_tenant_outcome
        UNIQUE (tenant_id, outcome)
);

CREATE INDEX IF NOT EXISTS ix_contact_outcomes_tenant_active
    ON contact_outcomes (
        tenant_id,
        active
    );

-- Seed standard contact outcomes for all existing tenants
INSERT INTO contact_outcomes (tenant_id, outcome)
SELECT t.id, o.outcome
FROM tenants t
CROSS JOIN (
    VALUES
        ('No Answer, Left Message'),
        ('No Answer, No Message'),
        ('Left Voicemail'),
        ('Spoke to patient'),
        ('Appointment Scheduled'),
        ('Confirmed Appointment'),
        ('Screening Completed'),
        ('Appointment Completed'),
        ('Not Interested'),
        ('Requested Call Back'),
        ('Wrong Number'),
        ('Disconnected Number')
) AS o(outcome)
ON CONFLICT (tenant_id, outcome) DO NOTHING;

-- ============================================================
-- 2. PARTICIPANT CONTACT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS participant_contact_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,
    study_id                UUID,

    date_time_of_contact    TIMESTAMPTZ NOT NULL DEFAULT now(),
    contact_type            VARCHAR(100) NOT NULL,
    contact_method          VARCHAR(255),
    contacted_by_user_id    UUID NOT NULL,

    spoke_to                VARCHAR(255),
    regarding               TEXT,
    outcome                 VARCHAR(255) NOT NULL,
    comments                TEXT,

    sticky                  BOOLEAN NOT NULL DEFAULT FALSE,
    notify                  BOOLEAN NOT NULL DEFAULT FALSE,
    global                  BOOLEAN NOT NULL DEFAULT TRUE,
    last_contact            BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NOT NULL,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID NOT NULL,

    CONSTRAINT fk_contact_logs_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_contact_logs_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_contact_logs_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE SET NULL,

    CONSTRAINT fk_contact_logs_contacted_by_tenant
        FOREIGN KEY (tenant_id, contacted_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT fk_contact_logs_created_by_tenant
        FOREIGN KEY (tenant_id, created_by)
        REFERENCES users(tenant_id, id),

    CONSTRAINT fk_contact_logs_updated_by_tenant
        FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_participant_contact_logs_tenant_id
        UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS ix_participant_contact_logs_lookup
    ON participant_contact_logs (
        tenant_id,
        participant_id,
        sticky DESC,
        date_time_of_contact DESC
    );

CREATE INDEX IF NOT EXISTS ix_participant_contact_logs_study
    ON participant_contact_logs (
        tenant_id,
        study_id
    );

CREATE INDEX IF NOT EXISTS ix_participant_contact_logs_contact_type
    ON participant_contact_logs (
        tenant_id,
        contact_type
    );

-- ============================================================
-- 3. PARTICIPANTS: GLOBAL LAST CONTACT DATE
-- ============================================================

ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS global_last_contact_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_participants_tenant_last_contact
    ON participants (
        tenant_id,
        global_last_contact_date DESC
    );
