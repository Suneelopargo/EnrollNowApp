-- EnrollNow
-- V15: Audit & Change History
--
-- Provides tenant-scoped, append-only auditing.
--
-- audit_events:
--   high-level record of an action
--
-- entity_change_history:
--   field-level before/after changes associated with an audit event
--
-- Audit records are customer-owned data and therefore remain
-- inside the tenant schema / tenant data boundary.
--
-- These tables are append-only during normal application usage.
-- Tenant offboarding may still remove the entire tenant schema.

SET search_path TO enrollnow, public;


-- ============================================================
-- AUDIT EVENTS
-- ============================================================

CREATE TABLE audit_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    /*
     * NULL for system/background actions.
     */
    actor_user_id           UUID,

    /*
     * Examples:
     * USER
     * STUDY
     * PARTICIPANT
     * STUDY_CANDIDATE
     * CONSENT
     * STUDY_ENROLLMENT
     * SURVEY
     * TASK
     * COMMUNICATION
     * DOCUMENT
     */
    entity_type             VARCHAR(100) NOT NULL,

    /*
     * UUID of the affected business entity.
     *
     * This is intentionally not an FK because entity_type is
     * polymorphic across many tables.
     */
    entity_id               UUID,

    /*
     * Examples:
     * CREATE
     * UPDATE
     * DELETE
     * ACTIVATE
     * DEACTIVATE
     * LOGIN
     * LOGOUT
     * ASSIGN_ROLE
     * REMOVE_ROLE
     * SEND_INVITATION
     * RESET_PASSWORD
     * ENROLL
     * WITHDRAW
     */
    action                  VARCHAR(100) NOT NULL,

    /*
     * Optional human/business description.
     */
    description             VARCHAR(1000),

    /*
     * API, UI, IMPORT, SYSTEM, JOB, INTEGRATION, etc.
     */
    source                  VARCHAR(50) NOT NULL DEFAULT 'APPLICATION',

    /*
     * Allows multiple changes caused by one request/workflow
     * to be traced together.
     */
    correlation_id          UUID,

    /*
     * Optional external/request tracing identifier.
     */
    request_id              VARCHAR(255),

    /*
     * Entity snapshots.
     *
     * JSONB is appropriate because different entity types have
     * different structures.
     *
     * Sensitive values such as raw passwords, authentication
     * tokens and secrets must never be placed here.
     */
    before_data             JSONB,
    after_data              JSONB,

    occurred_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_audit_events_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_audit_events_actor_tenant
        FOREIGN KEY (tenant_id, actor_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_audit_events_tenant_id
        UNIQUE (tenant_id, id)
);


CREATE INDEX ix_audit_events_entity
    ON audit_events (
        tenant_id,
        entity_type,
        entity_id,
        occurred_at DESC
    );


CREATE INDEX ix_audit_events_actor
    ON audit_events (
        tenant_id,
        actor_user_id,
        occurred_at DESC
    );


CREATE INDEX ix_audit_events_action
    ON audit_events (
        tenant_id,
        action,
        occurred_at DESC
    );


CREATE INDEX ix_audit_events_correlation
    ON audit_events (
        tenant_id,
        correlation_id
    );


CREATE INDEX ix_audit_events_time
    ON audit_events (
        tenant_id,
        occurred_at DESC
    );


-- ============================================================
-- ENTITY CHANGE HISTORY
--
-- Optional field-level change details associated with an
-- audit event.
--
-- Example:
--
-- entity_type      = USER
-- entity_id        = ...
-- field_name       = status
-- previous_value   = "ACTIVE"
-- new_value        = "DISABLED"
--
-- Multiple rows may be recorded for one audit event.
-- ============================================================

CREATE TABLE entity_change_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    audit_event_id          UUID NOT NULL,

    entity_type             VARCHAR(100) NOT NULL,
    entity_id               UUID NOT NULL,

    field_name              VARCHAR(255) NOT NULL,

    /*
     * JSONB supports strings, numbers, booleans, dates,
     * arrays and structured values without losing data type.
     */
    previous_value          JSONB,
    new_value               JSONB,

    changed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_entity_change_history_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_entity_change_history_audit_event_tenant
        FOREIGN KEY (tenant_id, audit_event_id)
        REFERENCES audit_events(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_entity_change_history_tenant_id
        UNIQUE (tenant_id, id)
);


CREATE INDEX ix_entity_change_history_audit
    ON entity_change_history (
        tenant_id,
        audit_event_id
    );


CREATE INDEX ix_entity_change_history_entity
    ON entity_change_history (
        tenant_id,
        entity_type,
        entity_id,
        changed_at DESC
    );


CREATE INDEX ix_entity_change_history_field
    ON entity_change_history (
        tenant_id,
        entity_type,
        field_name,
        changed_at DESC
    );


-- ============================================================
-- APPEND-ONLY PROTECTION
--
-- Audit/history rows should never be modified during normal
-- application operation.
--
-- DROP SCHEMA / DROP TABLE remains possible for compliant
-- tenant offboarding.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_audit_record_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'Audit/history records are append-only and cannot be updated or deleted';
END;
$$;


CREATE TRIGGER trg_audit_events_append_only
BEFORE UPDATE OR DELETE
ON audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_record_modification();


CREATE TRIGGER trg_entity_change_history_append_only
BEFORE UPDATE OR DELETE
ON entity_change_history
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_record_modification();