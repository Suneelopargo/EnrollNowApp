-- ============================================================
-- EnrollNow Site Permission Roles
--
-- Customer-documented Site Permission levels:
--
--   None
--   Registry Access Only
--   Site Manager & Registry Access
--   Site Admin & Registry Access
--
-- "None" is represented by the absence of an active
-- SITE-scoped role assignment.
--
-- Stable UUIDs are used for system roles.
-- Application code should reference role CODE.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Site permission roles
-- ------------------------------------------------------------

INSERT INTO enrollnow.roles
(
    id,
    code,
    name,
    scope_type,
    description,
    system_role,
    active,
    created_at,
    updated_at
)
VALUES
(
    '53000000-0000-0000-0000-000000000001',
    'SITE_REGISTRY',
    'Registry Access',
    'SITE',
    'Access to site Registry without Site Admin access.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '53000000-0000-0000-0000-000000000002',
    'SITE_MANAGER',
    'Site Manager',
    'SITE',
    'Registry access and Site Admin capabilities limited to assigned studies.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '53000000-0000-0000-0000-000000000003',
    'SITE_ADMIN',
    'Site Admin',
    'SITE',
    'Full Registry and Site Admin access across the site.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2. Enforce one active Site Permission per user/site
--
-- Existing V3 scope constraint guarantees that a SITE-scoped
-- assignment has site_id only and does not simultaneously
-- contain team_id or study_id.
--
-- Customer documentation states that a user can have only
-- one Site Permission level.
-- ------------------------------------------------------------

CREATE UNIQUE INDEX
    uk_user_role_assignments_active_site_permission
ON enrollnow.user_role_assignments
(
    tenant_id,
    user_id,
    site_id
)
WHERE
    active = TRUE
    AND site_id IS NOT NULL
    AND team_id IS NULL
    AND study_id IS NULL;