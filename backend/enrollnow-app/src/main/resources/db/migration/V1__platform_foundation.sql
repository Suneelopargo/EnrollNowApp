-- EnrollNow Phase 1
-- V1: Platform / Tenancy Foundation

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS enrollnow;

SET search_path TO enrollnow, public;


-- ============================================================
-- TENANTS
-- One tenant represents one EnrollNow customer/client.
-- ============================================================

CREATE TABLE tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(200) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    default_timezone    VARCHAR(100),
    configuration       JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID,

    CONSTRAINT uk_tenants_code
        UNIQUE (code),

    CONSTRAINT ck_tenants_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

COMMENT ON TABLE tenants IS
'Top-level customer/client ownership boundary for the multi-tenant EnrollNow platform.';

COMMENT ON COLUMN tenants.configuration IS
'Non-secret tenant-specific business/runtime configuration. Infrastructure settings remain deployment configuration and secrets belong in an approved secrets manager.';


-- ============================================================
-- SITES
-- Physical / operational locations belonging to a tenant.
-- ============================================================

CREATE TABLE sites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,

    site_code           VARCHAR(50) NOT NULL,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,

    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state_region        VARCHAR(100),
    postal_code         VARCHAR(30),
    country_code        VARCHAR(3),

    phone               VARCHAR(50),
    email               VARCHAR(320),
    timezone            VARCHAR(100),

    active              BOOLEAN NOT NULL DEFAULT TRUE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID,

    CONSTRAINT fk_sites_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT uk_sites_tenant_code
        UNIQUE (tenant_id, site_code),

    CONSTRAINT uk_sites_tenant_id
        UNIQUE (tenant_id, id)
);

CREATE INDEX ix_sites_tenant_name
    ON sites (tenant_id, name);


-- ============================================================
-- TEAMS
-- Logical working groups within a tenant.
-- Teams are distinct from physical sites.
-- ============================================================

CREATE TABLE teams (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,

    name                        VARCHAR(200) NOT NULL,
    description                 TEXT,

    multi_study_participation   BOOLEAN NOT NULL DEFAULT TRUE,
    active                      BOOLEAN NOT NULL DEFAULT TRUE,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  UUID,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  UUID,

    CONSTRAINT fk_teams_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT uk_teams_tenant_name
        UNIQUE (tenant_id, name),

    CONSTRAINT uk_teams_tenant_id
        UNIQUE (tenant_id, id)
);