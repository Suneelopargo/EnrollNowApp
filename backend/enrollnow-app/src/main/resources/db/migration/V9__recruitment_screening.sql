-- EnrollNow
-- V9: Recruitment & Screening
--
-- Models how a Registry participant is sourced/referred,
-- becomes a candidate for a Study, progresses through
-- recruitment, and completes one or more screening attempts.
--
-- Consent and actual Study Enrollment are intentionally
-- deferred to V10.
--
-- All relationships use tenant-safe composite foreign keys.

SET search_path TO enrollnow, public;


-- ============================================================
-- RECRUITMENT SOURCES
--
-- Examples:
--   Website
--   Physician Referral
--   Existing Registry
--   Social Media
--   Community Outreach
--   Advertisement
--
-- Sources are tenant-configurable.
-- ============================================================

CREATE TABLE recruitment_sources (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    code                    VARCHAR(50) NOT NULL,
    name                    VARCHAR(150) NOT NULL,
    description             VARCHAR(500),

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_recruitment_sources_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT uk_recruitment_sources_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_recruitment_sources_code
        UNIQUE (tenant_id, code)
);


CREATE INDEX ix_recruitment_sources_active
    ON recruitment_sources (
        tenant_id,
        active
    );


-- ============================================================
-- PARTICIPANT REFERRALS
--
-- Records how a participant entered the recruitment pipeline.
--
-- A participant may have multiple referral/source events over
-- time. Referral does not itself imply Study enrollment.
-- ============================================================

CREATE TABLE participant_referrals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,

    source_id               UUID,

    /*
     * Optional Study context.
     *
     * Some referrals may initially be Registry-wide and not
     * associated with a specific Study.
     */
    study_id                UUID,

    referral_date           DATE NOT NULL DEFAULT CURRENT_DATE,

    referrer_name           VARCHAR(200),
    referrer_contact        VARCHAR(320),

    external_reference      VARCHAR(255),
    notes                   TEXT,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_participant_referrals_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_participant_referrals_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_participant_referrals_source_tenant
        FOREIGN KEY (tenant_id, source_id)
        REFERENCES recruitment_sources(tenant_id, id),

    CONSTRAINT fk_participant_referrals_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT uk_participant_referrals_tenant_id
        UNIQUE (tenant_id, id)
);


CREATE INDEX ix_participant_referrals_participant
    ON participant_referrals (
        tenant_id,
        participant_id
    );


CREATE INDEX ix_participant_referrals_study
    ON participant_referrals (
        tenant_id,
        study_id
    );


CREATE INDEX ix_participant_referrals_source
    ON participant_referrals (
        tenant_id,
        source_id
    );


-- ============================================================
-- STUDY CANDIDATES
--
-- Represents a participant being considered/recruited for one
-- Study.
--
-- This is where the Study-specific "potential participant"
-- lifecycle begins.
--
-- Participant Registry status remains independent.
-- ============================================================

CREATE TABLE study_candidates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID NOT NULL,
    participant_id          UUID NOT NULL,

    referral_id             UUID,

    /*
     * Current recruitment state.
     *
     * Detailed transition history is stored separately in
     * candidate_status_history.
     */
    status                  VARCHAR(30) NOT NULL DEFAULT 'REFERRED',

    status_reason           VARCHAR(500),

    assigned_to_user_id     UUID,

    first_contact_at        TIMESTAMPTZ,
    last_contact_at         TIMESTAMPTZ,

    qualified_at            TIMESTAMPTZ,
    disqualified_at         TIMESTAMPTZ,
    withdrawn_at            TIMESTAMPTZ,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_study_candidates_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_study_candidates_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_study_candidates_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_study_candidates_referral_tenant
        FOREIGN KEY (tenant_id, referral_id)
        REFERENCES participant_referrals(tenant_id, id),

    CONSTRAINT fk_study_candidates_assigned_user_tenant
        FOREIGN KEY (tenant_id, assigned_to_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_study_candidates_tenant_id
        UNIQUE (tenant_id, id),

    /*
     * One current recruitment/candidate record per
     * participant + Study.
     *
     * Historical status changes remain in history rather than
     * creating duplicate candidate records.
     */
    CONSTRAINT uk_study_candidates_participant_study
        UNIQUE (
            tenant_id,
            study_id,
            participant_id
        ),

    CONSTRAINT ck_study_candidates_status
        CHECK (
            status IN (
                'REFERRED',
                'CONTACTED',
                'SCREENING',
                'QUALIFIED',
                'DISQUALIFIED',
                'WITHDRAWN'
            )
        )
);


CREATE INDEX ix_study_candidates_study_status
    ON study_candidates (
        tenant_id,
        study_id,
        status
    );


CREATE INDEX ix_study_candidates_participant
    ON study_candidates (
        tenant_id,
        participant_id
    );


CREATE INDEX ix_study_candidates_assignee
    ON study_candidates (
        tenant_id,
        assigned_to_user_id
    );


-- ============================================================
-- CANDIDATE STATUS HISTORY
--
-- Append-only history of Study-specific recruitment status.
-- ============================================================

CREATE TABLE candidate_status_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    candidate_id            UUID NOT NULL,

    previous_status         VARCHAR(30),
    new_status              VARCHAR(30) NOT NULL,

    reason                  VARCHAR(500),

    changed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by              UUID,

    CONSTRAINT fk_candidate_status_history_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_candidate_status_history_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_candidate_status_history_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_candidate_status_history_previous
        CHECK (
            previous_status IS NULL
            OR previous_status IN (
                'REFERRED',
                'CONTACTED',
                'SCREENING',
                'QUALIFIED',
                'DISQUALIFIED',
                'WITHDRAWN'
            )
        ),

    CONSTRAINT ck_candidate_status_history_new
        CHECK (
            new_status IN (
                'REFERRED',
                'CONTACTED',
                'SCREENING',
                'QUALIFIED',
                'DISQUALIFIED',
                'WITHDRAWN'
            )
        )
);


CREATE INDEX ix_candidate_status_history_candidate
    ON candidate_status_history (
        tenant_id,
        candidate_id,
        changed_at DESC
    );


-- ============================================================
-- SCREENING SESSIONS
--
-- A candidate may undergo more than one screening attempt.
-- Example:
--
--   Attempt 1 -> incomplete
--   Attempt 2 -> completed / qualified
--
-- Screening questions themselves may eventually come from
-- configurable Study requirements/survey definitions.
-- ============================================================

CREATE TABLE screening_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    candidate_id            UUID NOT NULL,

    attempt_number          INTEGER NOT NULL DEFAULT 1,

    status                  VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',

    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at            TIMESTAMPTZ,

    screened_by_user_id     UUID,

    notes                   TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_screening_sessions_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_screening_sessions_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_screening_sessions_user_tenant
        FOREIGN KEY (tenant_id, screened_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_screening_sessions_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_screening_sessions_attempt
        UNIQUE (
            tenant_id,
            candidate_id,
            attempt_number
        ),

    CONSTRAINT ck_screening_sessions_attempt
        CHECK (attempt_number > 0),

    CONSTRAINT ck_screening_sessions_status
        CHECK (
            status IN (
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED',
                'ABANDONED'
            )
        ),

    CONSTRAINT ck_screening_sessions_dates
        CHECK (
            completed_at IS NULL
            OR completed_at >= started_at
        )
);


CREATE INDEX ix_screening_sessions_candidate
    ON screening_sessions (
        tenant_id,
        candidate_id,
        started_at DESC
    );


CREATE INDEX ix_screening_sessions_status
    ON screening_sessions (
        tenant_id,
        status
    );


-- ============================================================
-- SCREENING ANSWERS
--
-- Stores the answers captured during a screening attempt.
--
-- question_code is stable within the Study/configuration.
--
-- question_text_snapshot preserves what the user actually saw
-- at the time of screening.
--
-- answer_value uses JSONB because screening questions can have
-- different shapes:
--
--   boolean
--   number
--   text
--   date
--   single choice
--   multi choice
--
-- Searchable/reportable derived values can later be projected
-- into structured reporting tables.
-- ============================================================

CREATE TABLE screening_answers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    screening_session_id    UUID NOT NULL,

    question_code           VARCHAR(100) NOT NULL,
    question_text_snapshot  TEXT,

    answer_value            JSONB,

    answered_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_by_user_id     UUID,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_screening_answers_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_screening_answers_session_tenant
        FOREIGN KEY (tenant_id, screening_session_id)
        REFERENCES screening_sessions(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_screening_answers_user_tenant
        FOREIGN KEY (tenant_id, answered_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_screening_answers_tenant_id
        UNIQUE (tenant_id, id),

    /*
     * One current response per question within one screening
     * session.
     */
    CONSTRAINT uk_screening_answers_question
        UNIQUE (
            tenant_id,
            screening_session_id,
            question_code
        )
);


CREATE INDEX ix_screening_answers_session
    ON screening_answers (
        tenant_id,
        screening_session_id
    );


-- ============================================================
-- SCREENING OUTCOMES
--
-- One final outcome per screening session.
--
-- Candidate status can subsequently be updated to QUALIFIED
-- or DISQUALIFIED based on this result.
-- ============================================================

CREATE TABLE screening_outcomes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    screening_session_id    UUID NOT NULL,

    outcome                 VARCHAR(30) NOT NULL,

    reason_code             VARCHAR(100),
    reason_text             VARCHAR(500),

    evaluated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    evaluated_by_user_id    UUID,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_screening_outcomes_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_screening_outcomes_session_tenant
        FOREIGN KEY (tenant_id, screening_session_id)
        REFERENCES screening_sessions(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_screening_outcomes_user_tenant
        FOREIGN KEY (tenant_id, evaluated_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_screening_outcomes_tenant_id
        UNIQUE (tenant_id, id),

    /*
     * A completed screening attempt has one final outcome.
     */
    CONSTRAINT uk_screening_outcomes_session
        UNIQUE (
            tenant_id,
            screening_session_id
        ),

    CONSTRAINT ck_screening_outcomes_outcome
        CHECK (
            outcome IN (
                'QUALIFIED',
                'DISQUALIFIED',
                'PENDING',
                'INCOMPLETE'
            )
        )
);


CREATE INDEX ix_screening_outcomes_outcome
    ON screening_outcomes (
        tenant_id,
        outcome
    );