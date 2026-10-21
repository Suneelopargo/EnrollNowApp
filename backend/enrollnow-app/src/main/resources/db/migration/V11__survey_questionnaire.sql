-- EnrollNow
-- V11: Survey / Questionnaire
--
-- Separates survey design from participant responses.
--
-- Survey Definition
--       ↓
-- Survey Version
--       ↓
-- Questions / Options
--       ↓
-- Assignment
--       ↓
-- Response
--       ↓
-- Answers
--
-- Published versions should be treated as immutable by the
-- application. Changes should normally create a new version.
--
-- All tenant-owned relationships use tenant-safe composite FKs.

SET search_path TO enrollnow, public;


-- ============================================================
-- SURVEY DEFINITIONS
--
-- Logical survey/questionnaire.
--
-- Examples:
--   Participant Intake
--   Contact Preference Survey
--   Study Follow-up Questionnaire
--
-- study_id is optional so a survey may be:
--
--   tenant / registry wide
--   OR
--   specific to one Study
-- ============================================================

CREATE TABLE survey_definitions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID,

    code                    VARCHAR(100) NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_survey_definitions_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_survey_definitions_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT uk_survey_definitions_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_survey_definitions_code
        UNIQUE (
            tenant_id,
            code
        )
);


CREATE INDEX ix_survey_definitions_study
    ON survey_definitions (
        tenant_id,
        study_id
    );


CREATE INDEX ix_survey_definitions_active
    ON survey_definitions (
        tenant_id,
        active
    );


-- ============================================================
-- SURVEY VERSIONS
--
-- Versioned snapshot of a survey definition.
--
-- Application rule:
--
-- Once PUBLISHED and used for participant responses, existing
-- content should not be edited. A new version should be created.
-- ============================================================

CREATE TABLE survey_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    survey_definition_id    UUID NOT NULL,

    version_number          VARCHAR(50) NOT NULL,

    title                   VARCHAR(255) NOT NULL,
    introduction_text       TEXT,
    completion_text         TEXT,

    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    published_at            TIMESTAMPTZ,
    retired_at              TIMESTAMPTZ,

    /*
     * Flexible presentation/configuration settings:
     *
     * page layout
     * progress indicators
     * theme behavior
     * conditional UI configuration
     *
     * Core searchable business data remains relational.
     */
    configuration           JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_survey_versions_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_survey_versions_definition_tenant
        FOREIGN KEY (tenant_id, survey_definition_id)
        REFERENCES survey_definitions(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_survey_versions_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_survey_versions_definition_version
        UNIQUE (
            tenant_id,
            survey_definition_id,
            version_number
        ),

    CONSTRAINT ck_survey_versions_status
        CHECK (
            status IN (
                'DRAFT',
                'PUBLISHED',
                'RETIRED'
            )
        ),

    CONSTRAINT ck_survey_versions_dates
        CHECK (
            retired_at IS NULL
            OR published_at IS NULL
            OR retired_at >= published_at
        )
);


CREATE INDEX ix_survey_versions_definition_status
    ON survey_versions (
        tenant_id,
        survey_definition_id,
        status
    );


-- ============================================================
-- SURVEY QUESTIONS
--
-- Questions belong to a specific Survey Version.
--
-- question_type is intentionally VARCHAR rather than tightly
-- constrained because Survey Creator may support additional
-- question types over time.
--
-- Examples may include:
--
-- TEXT
-- SINGLE_CHOICE
-- MULTI_CHOICE
-- BOOLEAN
-- NUMBER
-- DATE
-- etc.
-- ============================================================

CREATE TABLE survey_questions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    survey_version_id       UUID NOT NULL,

    question_code           VARCHAR(100) NOT NULL,

    question_type           VARCHAR(50) NOT NULL,

    question_text           TEXT NOT NULL,

    help_text               TEXT,

    required                BOOLEAN NOT NULL DEFAULT FALSE,

    display_order           INTEGER NOT NULL,

    /*
     * Optional conditional display / validation configuration.
     *
     * Examples:
     * minimum / maximum
     * regex
     * display condition
     * branching rule
     */
    configuration           JSONB NOT NULL DEFAULT '{}'::jsonb,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,

    CONSTRAINT fk_survey_questions_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_survey_questions_version_tenant
        FOREIGN KEY (tenant_id, survey_version_id)
        REFERENCES survey_versions(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_survey_questions_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_survey_questions_code
        UNIQUE (
            tenant_id,
            survey_version_id,
            question_code
        ),

    CONSTRAINT ck_survey_questions_display_order
        CHECK (display_order > 0)
);


CREATE INDEX ix_survey_questions_version_order
    ON survey_questions (
        tenant_id,
        survey_version_id,
        display_order
    );


-- ============================================================
-- SURVEY QUESTION OPTIONS
--
-- Used for choice-based questions.
--
-- Examples:
--
-- YES / NO
-- MALE / FEMALE / OTHER
-- choice lists
--
-- option_value is stable machine-readable data.
-- option_label is the participant-facing value.
-- ============================================================

CREATE TABLE survey_question_options (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    question_id             UUID NOT NULL,

    option_value            VARCHAR(255) NOT NULL,
    option_label            VARCHAR(500) NOT NULL,

    display_order           INTEGER NOT NULL,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,

    CONSTRAINT fk_survey_question_options_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_survey_question_options_question_tenant
        FOREIGN KEY (tenant_id, question_id)
        REFERENCES survey_questions(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_survey_question_options_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_survey_question_options_value
        UNIQUE (
            tenant_id,
            question_id,
            option_value
        ),

    CONSTRAINT ck_survey_question_options_order
        CHECK (display_order > 0)
);


CREATE INDEX ix_survey_question_options_question_order
    ON survey_question_options (
        tenant_id,
        question_id,
        display_order
    );


-- ============================================================
-- SURVEY ASSIGNMENTS
--
-- Assigns a specific Survey Version to a participant.
--
-- Study context is optional because registry-level surveys are
-- also possible.
--
-- candidate_id / enrollment_id are optional workflow context.
-- ============================================================

CREATE TABLE survey_assignments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    survey_version_id       UUID NOT NULL,
    participant_id          UUID NOT NULL,

    study_id                UUID,
    candidate_id            UUID,
    enrollment_id           UUID,

    assigned_by_user_id     UUID,

    assigned_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    due_at                  TIMESTAMPTZ,

    status                  VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',

    completed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_survey_assignments_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_survey_assignments_version_tenant
        FOREIGN KEY (tenant_id, survey_version_id)
        REFERENCES survey_versions(tenant_id, id),

    CONSTRAINT fk_survey_assignments_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_survey_assignments_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_survey_assignments_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id),

    CONSTRAINT fk_survey_assignments_enrollment_tenant
        FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES study_enrollments(tenant_id, id),

    CONSTRAINT fk_survey_assignments_user_tenant
        FOREIGN KEY (tenant_id, assigned_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_survey_assignments_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_survey_assignments_status
        CHECK (
            status IN (
                'ASSIGNED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED',
                'EXPIRED'
            )
        ),

    CONSTRAINT ck_survey_assignments_dates
        CHECK (
            (due_at IS NULL OR due_at >= assigned_at)
            AND
            (completed_at IS NULL OR completed_at >= assigned_at)
            AND
            (cancelled_at IS NULL OR cancelled_at >= assigned_at)
        )
);


CREATE INDEX ix_survey_assignments_participant
    ON survey_assignments (
        tenant_id,
        participant_id,
        status
    );


CREATE INDEX ix_survey_assignments_study
    ON survey_assignments (
        tenant_id,
        study_id,
        status
    );


CREATE INDEX ix_survey_assignments_version
    ON survey_assignments (
        tenant_id,
        survey_version_id
    );


-- ============================================================
-- SURVEY RESPONSES
--
-- Represents one participant attempt against one Assignment.
--
-- Multiple attempts are supported where business rules allow.
-- ============================================================

CREATE TABLE survey_responses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    survey_assignment_id    UUID NOT NULL,

    attempt_number          INTEGER NOT NULL DEFAULT 1,

    status                  VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',

    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at            TIMESTAMPTZ,

    /*
     * Allows responses entered by:
     *
     * participant
     * staff member
     * import process
     *
     * NULL can represent participant/self-service response.
     */
    entered_by_user_id      UUID,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_survey_responses_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_survey_responses_assignment_tenant
        FOREIGN KEY (tenant_id, survey_assignment_id)
        REFERENCES survey_assignments(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_survey_responses_user_tenant
        FOREIGN KEY (tenant_id, entered_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_survey_responses_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_survey_responses_attempt
        UNIQUE (
            tenant_id,
            survey_assignment_id,
            attempt_number
        ),

    CONSTRAINT ck_survey_responses_attempt
        CHECK (attempt_number > 0),

    CONSTRAINT ck_survey_responses_status
        CHECK (
            status IN (
                'IN_PROGRESS',
                'SUBMITTED',
                'ABANDONED'
            )
        ),

    CONSTRAINT ck_survey_responses_dates
        CHECK (
            submitted_at IS NULL
            OR submitted_at >= started_at
        )
);


CREATE INDEX ix_survey_responses_assignment
    ON survey_responses (
        tenant_id,
        survey_assignment_id,
        attempt_number
    );


CREATE INDEX ix_survey_responses_status
    ON survey_responses (
        tenant_id,
        status
    );


-- ============================================================
-- SURVEY ANSWERS
--
-- One current answer per Question within a Response.
--
-- answer_value is JSONB because Question types legitimately
-- produce different data shapes:
--
-- TEXT:
--   "some text"
--
-- BOOLEAN:
--   true
--
-- NUMBER:
--   42
--
-- SINGLE_CHOICE:
--   "OPTION_A"
--
-- MULTI_CHOICE:
--   ["A", "B"]
--
-- DATE:
--   "2026-10-17"
--
-- Stable identifiers and relationships remain relational.
-- ============================================================

CREATE TABLE survey_answers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    survey_response_id      UUID NOT NULL,
    question_id             UUID NOT NULL,

    /*
     * Preserve what was displayed at response time.
     *
     * Normally the linked published Survey Version should already
     * be immutable, but snapshots provide additional historical
     * protection and simplify reporting/export.
     */
    question_code_snapshot  VARCHAR(100) NOT NULL,
    question_text_snapshot  TEXT,

    answer_value            JSONB,

    answered_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_survey_answers_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_survey_answers_response_tenant
        FOREIGN KEY (tenant_id, survey_response_id)
        REFERENCES survey_responses(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_survey_answers_question_tenant
        FOREIGN KEY (tenant_id, question_id)
        REFERENCES survey_questions(tenant_id, id),

    CONSTRAINT uk_survey_answers_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_survey_answers_response_question
        UNIQUE (
            tenant_id,
            survey_response_id,
            question_id
        )
);


CREATE INDEX ix_survey_answers_response
    ON survey_answers (
        tenant_id,
        survey_response_id
    );


CREATE INDEX ix_survey_answers_question
    ON survey_answers (
        tenant_id,
        question_id
    );