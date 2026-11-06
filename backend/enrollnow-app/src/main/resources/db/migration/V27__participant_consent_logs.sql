-- EnrollNow
-- V27: Participant Consent Logs & Attachments
--
-- Implements production persistence for participant administrative consent logs
-- with full legacy Ripple functional parity:
--   - participant_consent_logs: Administrative consent logs, type, title, version,
--     consented_by, expiration, attachment metadata, flags (sticky, global, notify, last_contact).
--
-- All tables are tenant-scoped with tenant-safe composite foreign keys.

SET search_path TO enrollnow, public;

-- ============================================================
-- PARTICIPANT CONSENT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS participant_consent_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,
    study_id                UUID,

    consent_date            TIMESTAMPTZ NOT NULL DEFAULT now(),
    consent_type            VARCHAR(100) NOT NULL,
    consent_title           VARCHAR(255) NOT NULL,
    consented_by            VARCHAR(255),
    version                 VARCHAR(50),
    expiration              TIMESTAMPTZ,

    file_attached           BOOLEAN NOT NULL DEFAULT FALSE,
    file_id                 UUID,
    file_name               VARCHAR(255),
    file_size_bytes         BIGINT,
    file_content_type       VARCHAR(100),
    file_storage_path       VARCHAR(1000),

    comments                TEXT,

    sticky                  BOOLEAN NOT NULL DEFAULT FALSE,
    notify                  BOOLEAN NOT NULL DEFAULT FALSE,
    global                  BOOLEAN NOT NULL DEFAULT TRUE,
    last_contact            BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NOT NULL,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID NOT NULL,

    CONSTRAINT fk_consent_logs_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_consent_logs_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_consent_logs_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE SET NULL,

    CONSTRAINT fk_consent_logs_created_by_tenant
        FOREIGN KEY (tenant_id, created_by)
        REFERENCES users(tenant_id, id),

    CONSTRAINT fk_consent_logs_updated_by_tenant
        FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_participant_consent_logs_tenant_id
        UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS ix_participant_consent_logs_lookup
    ON participant_consent_logs (
        tenant_id,
        participant_id,
        sticky DESC,
        consent_date DESC
    );

CREATE INDEX IF NOT EXISTS ix_participant_consent_logs_study
    ON participant_consent_logs (
        tenant_id,
        study_id
    );

CREATE INDEX IF NOT EXISTS ix_participant_consent_logs_type
    ON participant_consent_logs (
        tenant_id,
        consent_type
    );
