-- EnrollNow
-- V17: Integration / External References
--
-- Provides:
--   external-system identifier mapping
--   inbound / outbound integration event tracking
--   processing-attempt history
--
-- This keeps external identifiers and integration execution
-- concerns out of the core business tables.
--
-- All tenant-owned relationships remain tenant-scoped.

SET search_path TO enrollnow, public;


-- ============================================================
-- EXTERNAL SYSTEM LINKS
--
-- Maps an EnrollNow entity to an identifier in an external
-- system.
--
-- Examples:
--   participant -> Epic patient id
--   study       -> CTMS study id
--   enrollment  -> external subject id
--   user        -> external identity id
--
-- entity_type + entity_id are intentionally polymorphic.
-- entity_id is therefore not a direct FK.
-- ============================================================

CREATE TABLE external_system_links (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    external_system         VARCHAR(100) NOT NULL,

    entity_type             VARCHAR(100) NOT NULL,
    entity_id               UUID NOT NULL,

    external_identifier     VARCHAR(500) NOT NULL,

    external_identifier_type VARCHAR(100),

    source_system           VARCHAR(100),

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_external_system_links_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT uk_external_system_links_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_external_system_link
        UNIQUE (
            tenant_id,
            external_system,
            entity_type,
            external_identifier
        )
);


CREATE INDEX ix_external_system_links_entity
    ON external_system_links (
        tenant_id,
        entity_type,
        entity_id
    );


CREATE INDEX ix_external_system_links_external
    ON external_system_links (
        tenant_id,
        external_system,
        external_identifier
    );


CREATE INDEX ix_external_system_links_active
    ON external_system_links (
        tenant_id,
        active
    );


-- ============================================================
-- INTEGRATION EVENTS
--
-- Tracks inbound / outbound interactions with external systems.
--
-- Examples:
--   participant import
--   participant export
--   EHR demographic update
--   enrollment notification
--   webhook receipt
--   bulk import/export
--
-- Payloads are JSONB because external systems differ in shape.
-- ============================================================

CREATE TABLE integration_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    external_system         VARCHAR(100) NOT NULL,

    direction               VARCHAR(20) NOT NULL,

    event_type              VARCHAR(150) NOT NULL,

    /*
     * Optional EnrollNow entity context.
     */
    entity_type             VARCHAR(100),
    entity_id               UUID,

    /*
     * External system's event/message/request identifier.
     */
    external_event_id       VARCHAR(500),

    /*
     * Useful for end-to-end tracing across systems.
     */
    correlation_id          UUID,

    request_id              VARCHAR(255),

    status                  VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',

    /*
     * Raw/normalized payloads.
     *
     * Do not place passwords, JWTs, secrets, or raw credentials
     * into these fields.
     */
    request_payload         JSONB,
    response_payload        JSONB,

    received_at             TIMESTAMPTZ,
    processing_started_at   TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    failed_at               TIMESTAMPTZ,

    retry_count             INTEGER NOT NULL DEFAULT 0,

    last_error_code         VARCHAR(100),
    last_error_message      TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_integration_events_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT uk_integration_events_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_integration_events_direction
        CHECK (
            direction IN (
                'INBOUND',
                'OUTBOUND'
            )
        ),

    CONSTRAINT ck_integration_events_status
        CHECK (
            status IN (
                'RECEIVED',
                'PENDING',
                'PROCESSING',
                'COMPLETED',
                'FAILED',
                'DEAD_LETTER'
            )
        ),

    CONSTRAINT ck_integration_events_retry_count
        CHECK (retry_count >= 0),

    CONSTRAINT ck_integration_events_dates
        CHECK (
            (processing_started_at IS NULL
                OR processing_started_at >= created_at)
            AND
            (completed_at IS NULL
                OR completed_at >= created_at)
            AND
            (failed_at IS NULL
                OR failed_at >= created_at)
        )
);


CREATE INDEX ix_integration_events_system_status
    ON integration_events (
        tenant_id,
        external_system,
        status,
        created_at DESC
    );


CREATE INDEX ix_integration_events_entity
    ON integration_events (
        tenant_id,
        entity_type,
        entity_id,
        created_at DESC
    );


CREATE INDEX ix_integration_events_external_event
    ON integration_events (
        tenant_id,
        external_system,
        external_event_id
    );


CREATE INDEX ix_integration_events_correlation
    ON integration_events (
        tenant_id,
        correlation_id
    );


CREATE INDEX ix_integration_events_status
    ON integration_events (
        tenant_id,
        status,
        created_at DESC
    );


-- ============================================================
-- INTEGRATION EVENT ATTEMPTS
--
-- Append-only processing-attempt history.
--
-- One integration event may have several attempts because of
-- retry logic.
-- ============================================================

CREATE TABLE integration_event_attempts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    integration_event_id    UUID NOT NULL,

    attempt_number          INTEGER NOT NULL,

    processor               VARCHAR(255),

    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at            TIMESTAMPTZ,

    status                  VARCHAR(30) NOT NULL,

    http_status             INTEGER,

    error_code              VARCHAR(100),
    error_message           TEXT,

    response_payload        JSONB,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_integration_event_attempts_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_integration_event_attempts_event_tenant
        FOREIGN KEY (tenant_id, integration_event_id)
        REFERENCES integration_events(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_integration_event_attempts_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_integration_event_attempt_number
        UNIQUE (
            tenant_id,
            integration_event_id,
            attempt_number
        ),

    CONSTRAINT ck_integration_event_attempt_number
        CHECK (attempt_number > 0),

    CONSTRAINT ck_integration_event_attempt_status
        CHECK (
            status IN (
                'STARTED',
                'SUCCESS',
                'FAILED'
            )
        ),

    CONSTRAINT ck_integration_event_attempt_http_status
        CHECK (
            http_status IS NULL
            OR (http_status >= 100 AND http_status <= 599)
        ),

    CONSTRAINT ck_integration_event_attempt_dates
        CHECK (
            completed_at IS NULL
            OR completed_at >= started_at
        )
);


CREATE INDEX ix_integration_event_attempts_event
    ON integration_event_attempts (
        tenant_id,
        integration_event_id,
        attempt_number DESC
    );


CREATE INDEX ix_integration_event_attempts_status
    ON integration_event_attempts (
        tenant_id,
        status,
        started_at DESC
    );