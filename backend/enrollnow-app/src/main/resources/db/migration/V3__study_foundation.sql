-- EnrollNow Phase 1
-- V3: Study Foundation and Study-Scoped Authorization

SET search_path TO enrollnow, public;


-- ============================================================
-- STUDIES
-- A study belongs to exactly one tenant.
-- A study may operate at one or more sites.
-- ============================================================

CREATE TABLE studies (
    id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                           UUID NOT NULL,

    study_code                          VARCHAR(50) NOT NULL,
    name                                VARCHAR(100) NOT NULL,
    long_name                           TEXT,
    prefix                              VARCHAR(50),
    description                         TEXT,
    irb_id                              VARCHAR(100),

    recruitment_start_date              DATE,
    recruitment_end_date                DATE,
    completion_date                     DATE,

    sample_size                         INTEGER,
    locale                              VARCHAR(20),

    custom_id_generation_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    next_sequential_identifier          BIGINT NOT NULL DEFAULT 0,

    allow_participation_in_other_studies BOOLEAN NOT NULL DEFAULT TRUE,
    show_global_comments                BOOLEAN NOT NULL DEFAULT FALSE,
    default_global_logs                 BOOLEAN NOT NULL DEFAULT FALSE,

    study_url_label                     VARCHAR(100),
    study_url                           TEXT,

    archived                            BOOLEAN NOT NULL DEFAULT FALSE,

    created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                          UUID,
    updated_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                          UUID,

    CONSTRAINT fk_studies_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT uk_studies_tenant_code
        UNIQUE (tenant_id, study_code),

    CONSTRAINT uk_studies_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_studies_dates
        CHECK (
            recruitment_end_date IS NULL
            OR recruitment_start_date IS NULL
            OR recruitment_end_date >= recruitment_start_date
        ),

    CONSTRAINT ck_studies_sample_size
        CHECK (
            sample_size IS NULL
            OR sample_size >= 0
        ),

    CONSTRAINT ck_studies_next_identifier
        CHECK (
            next_sequential_identifier >= 0
        )
);

CREATE INDEX ix_studies_tenant_archived
    ON studies (tenant_id, archived);

CREATE INDEX ix_studies_dates
    ON studies (
        tenant_id,
        recruitment_start_date,
        recruitment_end_date
    );


-- ============================================================
-- STUDY <-> SITE
--
-- A study can run at multiple sites.
-- A site can support multiple studies.
-- ============================================================

CREATE TABLE study_sites (
    tenant_id       UUID NOT NULL,
    study_id        UUID NOT NULL,
    site_id         UUID NOT NULL,

    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (study_id, site_id),

    CONSTRAINT fk_study_sites_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_study_sites_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_study_sites_site_tenant
        FOREIGN KEY (tenant_id, site_id)
        REFERENCES sites(tenant_id, id)
);

CREATE INDEX ix_study_sites_tenant_site
    ON study_sites (tenant_id, site_id);

CREATE INDEX ix_study_sites_tenant_study
    ON study_sites (tenant_id, study_id);


-- ============================================================
-- TEAM <-> STUDY
--
-- Teams remain logical working groups and are not treated
-- as physical sites.
-- ============================================================

CREATE TABLE team_studies (
    tenant_id       UUID NOT NULL,
    team_id         UUID NOT NULL,
    study_id        UUID NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (team_id, study_id),

    CONSTRAINT fk_team_studies_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_team_studies_team_tenant
        FOREIGN KEY (tenant_id, team_id)
        REFERENCES teams(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_team_studies_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE CASCADE
);

CREATE INDEX ix_team_studies_tenant_study
    ON team_studies (tenant_id, study_id);


-- ============================================================
-- STUDY MEMBERS
--
-- Represents membership/association with the study.
-- Authorization itself remains in user_role_assignments.
-- ============================================================

CREATE TABLE study_members (
    tenant_id       UUID NOT NULL,
    study_id        UUID NOT NULL,
    user_id         UUID NOT NULL,

    active          BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (study_id, user_id),

    CONSTRAINT fk_study_members_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_study_members_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_study_members_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id)
        ON DELETE CASCADE
);

CREATE INDEX ix_study_members_tenant_user
    ON study_members (tenant_id, user_id);

CREATE INDEX ix_study_members_tenant_study_active
    ON study_members (tenant_id, study_id, active);


-- ============================================================
-- STUDY GRANTS
-- ============================================================

CREATE TABLE study_grants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    study_id        UUID NOT NULL,

    grant_number    VARCHAR(100),
    agency          VARCHAR(200),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_study_grants_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_study_grants_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE CASCADE
);

CREATE INDEX ix_study_grants_study
    ON study_grants (tenant_id, study_id);


-- ============================================================
-- STUDY REQUIREMENTS
--
-- One requirements/configuration record per study.
-- JSONB is reserved for flexible study-specific requirement
-- configuration that is not yet justified as fixed columns.
-- ============================================================

CREATE TABLE study_requirements (
    study_id        UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,

    sample_size     INTEGER,

    configuration   JSONB NOT NULL DEFAULT '{}'::jsonb,

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_study_requirements_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_study_requirements_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT ck_study_requirements_sample_size
        CHECK (
            sample_size IS NULL
            OR sample_size >= 0
        )
);


-- ============================================================
-- STUDY MILESTONES
-- ============================================================

CREATE TABLE study_milestones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    study_id            UUID NOT NULL,

    milestone_date      DATE NOT NULL,
    participant_target  INTEGER,
    description         TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_study_milestones_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_study_milestones_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT ck_study_milestones_target
        CHECK (
            participant_target IS NULL
            OR participant_target >= 0
        )
);

CREATE INDEX ix_study_milestones_study_date
    ON study_milestones (
        tenant_id,
        study_id,
        milestone_date
    );


-- ============================================================
-- STUDY-SCOPED RBAC
--
-- V2 intentionally deferred study_id until studies existed.
-- Study-scoped permissions can now be represented.
-- ============================================================

ALTER TABLE user_role_assignments
    ADD COLUMN study_id UUID;


ALTER TABLE user_role_assignments
    ADD CONSTRAINT fk_user_role_assignment_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id);


CREATE INDEX ix_user_role_assignments_study
    ON user_role_assignments (
        tenant_id,
        study_id
    );


-- ============================================================
-- ROLE ASSIGNMENT SCOPE INTEGRITY
--
-- An assignment represents one explicit scope:
--
-- tenant scope -> site_id/team_id/study_id all NULL
-- site scope   -> site_id only
-- team scope   -> team_id only
-- study scope  -> study_id only
--
-- This avoids ambiguous assignments such as one row having
-- both site_id and study_id.
-- ============================================================

ALTER TABLE user_role_assignments
    ADD CONSTRAINT ck_user_role_assignment_single_scope
        CHECK (
            (
                CASE WHEN site_id IS NOT NULL THEN 1 ELSE 0 END
                +
                CASE WHEN team_id IS NOT NULL THEN 1 ELSE 0 END
                +
                CASE WHEN study_id IS NOT NULL THEN 1 ELSE 0 END
            ) <= 1
        );