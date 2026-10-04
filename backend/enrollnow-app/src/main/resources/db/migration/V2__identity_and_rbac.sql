-- EnrollNow Phase 1
-- V2: Identity, Security and RBAC Foundation

SET search_path TO enrollnow, public;


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    title                   VARCHAR(150),
    timezone                VARCHAR(100),

    status                  VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    

    password_hash           VARCHAR(255),
    password_last_changed_at TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT ck_users_status
        CHECK (status IN ('ACTIVE', 'DISABLED', 'LOCKED')),

    CONSTRAINT uk_users_tenant_id
        UNIQUE (tenant_id, id)
);

CREATE INDEX ix_users_tenant_status
    ON users (tenant_id, status);

CREATE INDEX ix_users_tenant_name
    ON users (tenant_id, last_name, first_name);


-- ============================================================
-- USER EMAILS
-- ============================================================

CREATE TABLE user_emails (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,

    email           VARCHAR(320) NOT NULL,
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    primary_email   BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_user_emails_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_user_emails_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_user_emails_tenant_email
        UNIQUE (tenant_id, email),

    CONSTRAINT uk_user_emails_user_email
        UNIQUE (user_id, email)
);

CREATE INDEX ix_user_emails_user
    ON user_emails (tenant_id, user_id);
    
CREATE UNIQUE INDEX uk_user_emails_one_primary
    ON user_emails (tenant_id, user_id)
    WHERE primary_email = TRUE;


-- ============================================================
-- USER SECURITY STATE
-- ============================================================

CREATE TABLE user_security_state (
    user_id                     UUID PRIMARY KEY,
    tenant_id                   UUID NOT NULL,

    failed_login_attempts       INT NOT NULL DEFAULT 0,
    locked_at                   TIMESTAMPTZ,
    lock_reason                 VARCHAR(255),

    password_expires_at         TIMESTAMPTZ,
    last_password_reset_at      TIMESTAMPTZ,
    last_activity_at            TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_user_security_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_user_security_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT ck_failed_login_attempts
        CHECK (failed_login_attempts >= 0)
);


-- ============================================================
-- TENANT SECURITY SETTINGS
-- Exact values are configurable and not hard-coded here.
-- ============================================================

CREATE TABLE security_settings (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                       UUID NOT NULL,

    max_failed_login_attempts       INT,
    prevent_concurrent_sessions     BOOLEAN NOT NULL DEFAULT FALSE,
    inactivity_logout_minutes       INT,
    inactivity_lock_days            INT,

    password_expiry_days            INT,
    password_history_count          INT,
    minimum_password_length         INT,
    minimum_password_strength       VARCHAR(30),

    require_digit                   BOOLEAN NOT NULL DEFAULT FALSE,
    require_symbol                  BOOLEAN NOT NULL DEFAULT FALSE,
    require_mixed_case              BOOLEAN NOT NULL DEFAULT FALSE,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                      UUID,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                      UUID,

    CONSTRAINT fk_security_settings_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT uk_security_settings_tenant
        UNIQUE (tenant_id),

    CONSTRAINT ck_security_failed_attempts
        CHECK (max_failed_login_attempts IS NULL OR max_failed_login_attempts > 0),

    CONSTRAINT ck_security_logout_minutes
        CHECK (inactivity_logout_minutes IS NULL OR inactivity_logout_minutes > 0),

    CONSTRAINT ck_security_lock_days
        CHECK (inactivity_lock_days IS NULL OR inactivity_lock_days > 0),

    CONSTRAINT ck_security_password_expiry
        CHECK (password_expiry_days IS NULL OR password_expiry_days > 0),

    CONSTRAINT ck_security_password_history
        CHECK (password_history_count IS NULL OR password_history_count >= 0),

    CONSTRAINT ck_security_password_length
        CHECK (minimum_password_length IS NULL OR minimum_password_length > 0)
);


-- ============================================================
-- ROLES
-- Role meaning is scoped; exact catalog is customer-approved.
-- ============================================================

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code            VARCHAR(100) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    scope_type      VARCHAR(30) NOT NULL,

    description     TEXT,
    system_role     BOOLEAN NOT NULL DEFAULT FALSE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_roles_code
        UNIQUE (code),

    CONSTRAINT ck_roles_scope_type
       CHECK (scope_type IN ('GLOBAL', 'TENANT', 'SITE', 'TEAM', 'STUDY'))
);


-- ============================================================
-- PERMISSIONS
-- ============================================================

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code            VARCHAR(150) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    resource        VARCHAR(100),
    action          VARCHAR(50),
    description     TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_permissions_code
        UNIQUE (code)
);


-- ============================================================
-- ROLE -> PERMISSION
-- ============================================================

CREATE TABLE role_permissions (
    role_id         UUID NOT NULL,
    permission_id   UUID NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON DELETE CASCADE
);


-- ============================================================
-- TEAM MEMBERSHIP
-- No direct Site <-> Team relationship is assumed.
-- ============================================================

CREATE TABLE team_memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    team_id         UUID NOT NULL,
    user_id         UUID NOT NULL,

    active          BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at       TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,

    CONSTRAINT fk_team_membership_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_team_membership_team_tenant
        FOREIGN KEY (tenant_id, team_id)
        REFERENCES teams(tenant_id, id),

    CONSTRAINT fk_team_membership_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_team_membership
        UNIQUE (tenant_id, team_id, user_id)
);


-- ============================================================
-- USER ROLE ASSIGNMENTS
--
-- study_id is intentionally deferred until studies exist.
-- ============================================================

CREATE TABLE user_role_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    role_id         UUID NOT NULL,
 
    site_id 		UUID,
    team_id         UUID,

    effective_from  TIMESTAMPTZ,
    effective_to    TIMESTAMPTZ,
    active          BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,

    CONSTRAINT fk_user_role_assignment_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_user_role_assignment_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT fk_user_role_assignment_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),
        
    CONSTRAINT fk_user_role_assignment_site_tenant
	    FOREIGN KEY (tenant_id, site_id)
	    REFERENCES sites(tenant_id, id),

    CONSTRAINT fk_user_role_assignment_team_tenant
        FOREIGN KEY (tenant_id, team_id)
        REFERENCES teams(tenant_id, id),
        
   

    CONSTRAINT ck_user_role_assignment_dates
        CHECK (
            effective_to IS NULL
            OR effective_from IS NULL
            OR effective_to >= effective_from
        )
);

CREATE INDEX ix_user_role_assignments_user
    ON user_role_assignments (tenant_id, user_id);

CREATE INDEX ix_user_role_assignments_team
    ON user_role_assignments (tenant_id, team_id);

CREATE INDEX ix_user_role_assignments_role
    ON user_role_assignments (role_id);
    
CREATE INDEX ix_user_role_assignments_site
    ON user_role_assignments (tenant_id, site_id);
    
-- ============================================================
-- PASSWORD HISTORY
-- Supports configurable password reuse prevention.
-- ============================================================

CREATE TABLE user_password_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_password_history_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id)
        ON DELETE CASCADE
);

CREATE INDEX ix_password_history_user_created
    ON user_password_history (tenant_id, user_id, created_at DESC);
    
-- ============================================================
-- USER ACTION TOKENS
-- One-time tokens for password reset / account enrollment.
-- Store only a hash of the externally issued token.
-- ============================================================

CREATE TABLE user_action_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,

    token_type      VARCHAR(30) NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,

    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_user_action_token_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT ck_user_action_token_type
        CHECK (token_type IN ('PASSWORD_RESET', 'ENROLLMENT')),

    CONSTRAINT uk_user_action_token_hash
        UNIQUE (token_hash)
);

CREATE INDEX ix_user_action_tokens_user
    ON user_action_tokens (tenant_id, user_id, token_type);
    
 -- ============================================================
-- USER SESSIONS
-- Supports session revocation, concurrent-session policy
-- and administrative account/security actions.
-- ============================================================

CREATE TABLE user_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    user_id             UUID NOT NULL,

    session_token_hash  VARCHAR(255),
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at    TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    revoke_reason       VARCHAR(255),

    CONSTRAINT fk_user_sessions_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id)
        ON DELETE CASCADE
);

CREATE INDEX ix_user_sessions_active
    ON user_sessions (tenant_id, user_id, revoked_at);