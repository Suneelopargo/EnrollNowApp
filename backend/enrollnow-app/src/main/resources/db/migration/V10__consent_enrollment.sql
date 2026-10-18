-- EnrollNow
-- V10: Consent & Study Enrollment
--
-- Models:
--
--   Qualified Study Candidate
--          ↓
--   Study-specific Consent
--          ↓
--   Study Enrollment
--
-- Physical consent files / PDFs are intentionally deferred
-- to the Document module. This migration stores consent
-- definition/version metadata and transactional consent state.
--
-- All tenant-owned relationships remain tenant-safe.

SET search_path TO enrollnow, public;


-- ============================================================
-- CONSENT VERSIONS
--
-- Defines the Study-specific consent form/version available
-- to participants.
--
-- Historical versions are retained. A newer version should
-- create a new row rather than overwrite prior legal content.
-- ============================================================

CREATE TABLE consent_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    study_id                UUID NOT NULL,

    version_number          VARCHAR(50) NOT NULL,
    title                   VARCHAR(255) NOT NULL,

    description             TEXT,

    /*
     * Optional reference to an external/template identifier.
     * Actual stored files will be handled by the Document module.
     */
    external_reference      VARCHAR(255),

    effective_from          TIMESTAMPTZ,
    effective_to            TIMESTAMPTZ,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_consent_versions_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_consent_versions_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT uk_consent_versions_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_consent_versions_study_version
        UNIQUE (
            tenant_id,
            study_id,
            version_number
        ),

    CONSTRAINT ck_consent_versions_dates
        CHECK (
            effective_to IS NULL
            OR effective_from IS NULL
            OR effective_to >= effective_from
        )
);


CREATE INDEX ix_consent_versions_study_active
    ON consent_versions (
        tenant_id,
        study_id,
        active
    );


-- ============================================================
-- CONSENTS
--
-- Represents one consent decision/transaction for a participant
-- in a specific Study.
--
-- Multiple consent rows may exist over time, for example:
--
--   original consent
--   re-consent to newer version
--   withdrawal
--
-- The latest/current state is tracked with active.
-- ============================================================

CREATE TABLE consents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID NOT NULL,
    participant_id          UUID NOT NULL,
    candidate_id            UUID,

    consent_version_id      UUID NOT NULL,

    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    consented_at            TIMESTAMPTZ,
    declined_at             TIMESTAMPTZ,
    withdrawn_at            TIMESTAMPTZ,

    consented_by_user_id    UUID,

    /*
     * Supports electronic / paper / imported historical consent.
     */
    consent_method          VARCHAR(30),

    withdrawal_reason       VARCHAR(500),

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_consents_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_consents_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_consents_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_consents_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id),

    CONSTRAINT fk_consents_version_tenant
        FOREIGN KEY (tenant_id, consent_version_id)
        REFERENCES consent_versions(tenant_id, id),

    CONSTRAINT fk_consents_user_tenant
        FOREIGN KEY (tenant_id, consented_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_consents_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_consents_status
        CHECK (
            status IN (
                'PENDING',
                'CONSENTED',
                'DECLINED',
                'WITHDRAWN'
            )
        ),

    CONSTRAINT ck_consents_method
        CHECK (
            consent_method IS NULL
            OR consent_method IN (
                'ELECTRONIC',
                'PAPER',
                'VERBAL',
                'IMPORTED',
                'OTHER'
            )
        )
);


CREATE INDEX ix_consents_participant_study
    ON consents (
        tenant_id,
        participant_id,
        study_id
    );


CREATE INDEX ix_consents_candidate
    ON consents (
        tenant_id,
        candidate_id
    );


CREATE INDEX ix_consents_status
    ON consents (
        tenant_id,
        study_id,
        status
    );


/*
 * Only one active consent transaction/version for the same
 * participant + Study at a time.
 *
 * Previous consent rows remain available historically after
 * active is set to FALSE.
 */
CREATE UNIQUE INDEX uk_consents_one_active_per_participant_study
    ON consents (
        tenant_id,
        participant_id,
        study_id
    )
    WHERE active = TRUE;


-- ============================================================
-- CONSENT HISTORY
--
-- Append-only status history for a consent transaction.
-- ============================================================

CREATE TABLE consent_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    consent_id              UUID NOT NULL,

    previous_status         VARCHAR(30),
    new_status              VARCHAR(30) NOT NULL,

    reason                  VARCHAR(500),

    changed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by              UUID,

    CONSTRAINT fk_consent_history_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_consent_history_consent_tenant
        FOREIGN KEY (tenant_id, consent_id)
        REFERENCES consents(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_consent_history_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_consent_history_previous
        CHECK (
            previous_status IS NULL
            OR previous_status IN (
                'PENDING',
                'CONSENTED',
                'DECLINED',
                'WITHDRAWN'
            )
        ),

    CONSTRAINT ck_consent_history_new
        CHECK (
            new_status IN (
                'PENDING',
                'CONSENTED',
                'DECLINED',
                'WITHDRAWN'
            )
        )
);


CREATE INDEX ix_consent_history_consent
    ON consent_history (
        tenant_id,
        consent_id,
        changed_at DESC
    );


-- ============================================================
-- STUDY ENROLLMENTS
--
-- Represents actual enrollment of a Registry participant into
-- a Study.
--
-- Staff account "ENROLLMENT" action tokens are unrelated to
-- this table. This is clinical participant Study Enrollment.
--
-- A participant may participate in multiple Studies when
-- allowed by Study configuration, but only one enrollment row
-- exists for a participant within a particular Study.
-- ============================================================

CREATE TABLE study_enrollments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID NOT NULL,
    participant_id          UUID NOT NULL,
    candidate_id            UUID,
    consent_id              UUID NOT NULL,

    /*
     * Optional Study-facing participant identifier.
     * The general Registry identifiers remain in
     * participant_identifiers.
     */
    study_participant_id    VARCHAR(100),

    status                  VARCHAR(30) NOT NULL DEFAULT 'ENROLLED',

    enrolled_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    enrolled_by_user_id     UUID,

    completed_at            TIMESTAMPTZ,
    withdrawn_at            TIMESTAMPTZ,

    withdrawal_reason       VARCHAR(500),

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_study_enrollments_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_study_enrollments_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_study_enrollments_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_study_enrollments_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id),

    CONSTRAINT fk_study_enrollments_consent_tenant
        FOREIGN KEY (tenant_id, consent_id)
        REFERENCES consents(tenant_id, id),

    CONSTRAINT fk_study_enrollments_user_tenant
        FOREIGN KEY (tenant_id, enrolled_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_study_enrollments_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_study_enrollments_participant_study
        UNIQUE (
            tenant_id,
            study_id,
            participant_id
        ),

    CONSTRAINT uk_study_enrollments_study_participant_id
        UNIQUE (
            tenant_id,
            study_id,
            study_participant_id
        ),

    CONSTRAINT ck_study_enrollments_status
        CHECK (
            status IN (
                'ENROLLED',
                'ACTIVE',
                'COMPLETED',
                'WITHDRAWN'
            )
        ),

    CONSTRAINT ck_study_enrollments_dates
        CHECK (
            (completed_at IS NULL OR completed_at >= enrolled_at)
            AND
            (withdrawn_at IS NULL OR withdrawn_at >= enrolled_at)
        )
);


CREATE INDEX ix_study_enrollments_study_status
    ON study_enrollments (
        tenant_id,
        study_id,
        status
    );


CREATE INDEX ix_study_enrollments_participant
    ON study_enrollments (
        tenant_id,
        participant_id
    );


CREATE INDEX ix_study_enrollments_candidate
    ON study_enrollments (
        tenant_id,
        candidate_id
    );


-- ============================================================
-- ENROLLMENT STATUS HISTORY
--
-- Append-only Study Enrollment lifecycle.
-- ============================================================

CREATE TABLE enrollment_status_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    enrollment_id           UUID NOT NULL,

    previous_status         VARCHAR(30),
    new_status              VARCHAR(30) NOT NULL,

    reason                  VARCHAR(500),

    changed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by              UUID,

    CONSTRAINT fk_enrollment_status_history_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_enrollment_status_history_enrollment_tenant
        FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES study_enrollments(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_enrollment_status_history_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_enrollment_status_history_previous
        CHECK (
            previous_status IS NULL
            OR previous_status IN (
                'ENROLLED',
                'ACTIVE',
                'COMPLETED',
                'WITHDRAWN'
            )
        ),

    CONSTRAINT ck_enrollment_status_history_new
        CHECK (
            new_status IN (
                'ENROLLED',
                'ACTIVE',
                'COMPLETED',
                'WITHDRAWN'
            )
        )
);


CREATE INDEX ix_enrollment_status_history_enrollment
    ON enrollment_status_history (
        tenant_id,
        enrollment_id,
        changed_at DESC
    );