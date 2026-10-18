-- EnrollNow
-- V13: Communications
--
-- Supports:
--   reusable communication templates
--   communication/message records
--   one or more recipients
--   delivery / failure / bounce events
--
-- Intended channels:
--   EMAIL
--   SMS
--   PHONE
--   OTHER
--
-- All tenant-owned relationships use tenant-safe composite FKs.

SET search_path TO enrollnow, public;


-- ============================================================
-- COMMUNICATION TEMPLATES
--
-- Reusable tenant/study-level templates.
-- ============================================================

CREATE TABLE communication_templates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID,

    code                    VARCHAR(100) NOT NULL,
    name                    VARCHAR(255) NOT NULL,

    channel                 VARCHAR(30) NOT NULL,

    subject_template        VARCHAR(500),
    body_template           TEXT NOT NULL,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_communication_templates_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_communication_templates_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT uk_communication_templates_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_communication_templates_code
        UNIQUE (
            tenant_id,
            code
        ),

    CONSTRAINT ck_communication_templates_channel
        CHECK (
            channel IN (
                'EMAIL',
                'SMS',
                'PHONE',
                'OTHER'
            )
        )
);


CREATE INDEX ix_communication_templates_study
    ON communication_templates (
        tenant_id,
        study_id,
        active
    );


-- ============================================================
-- COMMUNICATIONS
--
-- One communication transaction/message.
--
-- May optionally relate to:
--   study
--   participant
--   candidate
--   enrollment
--
-- body_snapshot and subject_snapshot preserve exactly what was
-- sent, even if the source template changes later.
-- ============================================================

CREATE TABLE communications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID,
    participant_id          UUID,
    candidate_id            UUID,
    enrollment_id           UUID,

    template_id             UUID,

    channel                 VARCHAR(30) NOT NULL,

    direction               VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND',

    subject_snapshot        VARCHAR(500),
    body_snapshot           TEXT,

    status                  VARCHAR(30) NOT NULL DEFAULT 'CREATED',

    initiated_by_user_id    UUID,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at                 TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,

    external_message_id     VARCHAR(255),

    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT fk_communications_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_communications_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_communications_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_communications_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id),

    CONSTRAINT fk_communications_enrollment_tenant
        FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES study_enrollments(tenant_id, id),

    CONSTRAINT fk_communications_template_tenant
        FOREIGN KEY (tenant_id, template_id)
        REFERENCES communication_templates(tenant_id, id),

    CONSTRAINT fk_communications_user_tenant
        FOREIGN KEY (tenant_id, initiated_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_communications_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_communications_channel
        CHECK (
            channel IN (
                'EMAIL',
                'SMS',
                'PHONE',
                'OTHER'
            )
        ),

    CONSTRAINT ck_communications_direction
        CHECK (
            direction IN (
                'OUTBOUND',
                'INBOUND'
            )
        ),

    CONSTRAINT ck_communications_status
        CHECK (
            status IN (
                'CREATED',
                'QUEUED',
                'SENT',
                'DELIVERED',
                'FAILED',
                'BOUNCED',
                'CANCELLED',
                'COMPLETED'
            )
        ),

    CONSTRAINT ck_communications_dates
        CHECK (
            (sent_at IS NULL OR sent_at >= created_at)
            AND
            (completed_at IS NULL OR completed_at >= created_at)
        )
);


CREATE INDEX ix_communications_participant
    ON communications (
        tenant_id,
        participant_id,
        created_at DESC
    );


CREATE INDEX ix_communications_study
    ON communications (
        tenant_id,
        study_id,
        created_at DESC
    );


CREATE INDEX ix_communications_candidate
    ON communications (
        tenant_id,
        candidate_id,
        created_at DESC
    );


CREATE INDEX ix_communications_status
    ON communications (
        tenant_id,
        status,
        created_at DESC
    );


CREATE INDEX ix_communications_external_message
    ON communications (
        tenant_id,
        external_message_id
    );


-- ============================================================
-- COMMUNICATION RECIPIENTS
--
-- A communication may have one or multiple recipients.
--
-- recipient_value preserves the actual destination used at
-- send time, e.g.:
--
--   email address
--   phone number
--
-- participant/contact linkage is optional because communications
-- may also be sent to external recipients.
-- ============================================================

CREATE TABLE communication_recipients (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    communication_id        UUID NOT NULL,

    participant_id          UUID,

    recipient_type          VARCHAR(30) NOT NULL DEFAULT 'TO',

    recipient_name          VARCHAR(255),

    recipient_value         VARCHAR(500) NOT NULL,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_communication_recipients_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_communication_recipients_communication_tenant
        FOREIGN KEY (tenant_id, communication_id)
        REFERENCES communications(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_communication_recipients_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT uk_communication_recipients_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_communication_recipient_value
        UNIQUE (
            tenant_id,
            communication_id,
            recipient_type,
            recipient_value
        ),

    CONSTRAINT ck_communication_recipient_type
        CHECK (
            recipient_type IN (
                'TO',
                'CC',
                'BCC',
                'PHONE',
                'OTHER'
            )
        )
);


CREATE INDEX ix_communication_recipients_communication
    ON communication_recipients (
        tenant_id,
        communication_id
    );


CREATE INDEX ix_communication_recipients_participant
    ON communication_recipients (
        tenant_id,
        participant_id
    );


-- ============================================================
-- COMMUNICATION DELIVERY EVENTS
--
-- Append-only provider/delivery history.
--
-- Examples:
--
-- QUEUED
-- SENT
-- DELIVERED
-- FAILED
-- BOUNCED
-- OPENED
-- CLICKED
--
-- provider_payload is intentionally JSONB because external
-- providers return different event shapes.
-- ============================================================

CREATE TABLE communication_delivery_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    communication_id        UUID NOT NULL,
    recipient_id            UUID,

    event_type              VARCHAR(50) NOT NULL,

    event_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    provider                VARCHAR(100),

    provider_event_id       VARCHAR(255),

    error_code              VARCHAR(100),
    error_message           TEXT,

    provider_payload        JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_communication_delivery_events_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_communication_delivery_events_communication_tenant
        FOREIGN KEY (tenant_id, communication_id)
        REFERENCES communications(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_communication_delivery_events_recipient_tenant
        FOREIGN KEY (tenant_id, recipient_id)
        REFERENCES communication_recipients(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_communication_delivery_events_tenant_id
        UNIQUE (tenant_id, id)
);


CREATE INDEX ix_communication_delivery_events_communication
    ON communication_delivery_events (
        tenant_id,
        communication_id,
        event_at DESC
    );


CREATE INDEX ix_communication_delivery_events_recipient
    ON communication_delivery_events (
        tenant_id,
        recipient_id,
        event_at DESC
    );


CREATE INDEX ix_communication_delivery_events_type
    ON communication_delivery_events (
        tenant_id,
        event_type,
        event_at DESC
    );