-- EnrollNow
-- V18: Site Permission Catalog and Role-to-Permission Mappings
--
-- Purpose:
-- Seeds canonical site-level permissions and maps them to existing
-- system site roles (SITE_REGISTRY, SITE_MANAGER, SITE_ADMIN)
-- without modifying existing roles or study permissions.

SET search_path TO enrollnow, public;

-- ============================================================
-- 1. SEED SITE PERMISSION CATALOG
-- ============================================================

INSERT INTO permissions (
    code,
    name,
    resource,
    action,
    description
)
VALUES
    (
        'REGISTRY_VIEW',
        'View Registry',
        'REGISTRY',
        'VIEW',
        'Allows viewing the participant registry, searching participants, and viewing registry details.'
    ),
    (
        'REGISTRY_MANAGE',
        'Manage Registry Participants',
        'REGISTRY',
        'MANAGE',
        'Allows adding and updating participants and saved searches in the registry.'
    ),
    (
        'SITE_ADMIN_ACCESS',
        'Access Site Administration',
        'SITE_ADMIN',
        'ACCESS',
        'Allows accessing the Site Administration module and navigation.'
    ),
    (
        'SITE_STUDIES_VIEW',
        'View Site Studies',
        'SITE_STUDY',
        'VIEW',
        'Allows viewing studies within Site Administration.'
    ),
    (
        'SITE_STUDIES_CREATE',
        'Create Site Studies',
        'SITE_STUDY',
        'CREATE',
        'Allows creating new studies within the site.'
    ),
    (
        'SITE_ALL_STUDIES_MANAGE',
        'Manage All Site Studies',
        'SITE_STUDY',
        'MANAGE_ALL',
        'Allows managing study access and settings across all studies in the site regardless of personal study membership.'
    ),
    (
        'SITE_USERS_VIEW',
        'View Site Users',
        'SITE_USER',
        'VIEW',
        'Allows viewing site users and their role assignments.'
    ),
    (
        'SITE_USERS_MANAGE',
        'Manage Site Users',
        'SITE_USER',
        'MANAGE',
        'Allows inviting users and managing non-admin site and study role assignments.'
    ),
    (
        'SITE_ADMIN_USERS_MANAGE',
        'Manage Site Administrators',
        'SITE_USER',
        'MANAGE_ADMINS',
        'Allows assigning, modifying, and revoking the Site Admin (SITE_ADMIN) role.'
    ),
    (
        'SITE_IMPORT_EXPORT',
        'Site Import and Export',
        'SITE_DATA',
        'IMPORT_EXPORT',
        'Allows importing and exporting site data.'
    ),
    (
        'SITE_AUDIT_LOG_VIEW',
        'View Site Audit Log',
        'SITE_AUDIT',
        'VIEW',
        'Allows viewing the site audit log.'
    ),
    (
        'SITE_SECURITY_MANAGE',
        'Manage Site Security',
        'SITE_SECURITY',
        'MANAGE',
        'Allows managing site security policies and settings.'
    ),
    (
        'SITE_SETTINGS_VIEW',
        'View Site General Settings',
        'SITE_SETTINGS',
        'VIEW',
        'Allows viewing site general settings.'
    ),
    (
        'SITE_SETTINGS_MANAGE',
        'Manage Site General Settings',
        'SITE_SETTINGS',
        'MANAGE',
        'Allows modifying site general settings.'
    )
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    description = EXCLUDED.description;

-- ============================================================
-- 2. MAP SITE_REGISTRY PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
  ON p.code IN (
      'REGISTRY_VIEW',
      'REGISTRY_MANAGE'
  )
WHERE r.code = 'SITE_REGISTRY'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 3. MAP SITE_MANAGER PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
  ON p.code IN (
      'REGISTRY_VIEW',
      'REGISTRY_MANAGE',
      'SITE_ADMIN_ACCESS',
      'SITE_STUDIES_VIEW',
      'SITE_STUDIES_CREATE',
      'SITE_USERS_VIEW',
      'SITE_USERS_MANAGE',
      'SITE_IMPORT_EXPORT',
      'SITE_AUDIT_LOG_VIEW',
      'SITE_SETTINGS_VIEW'
  )
WHERE r.code = 'SITE_MANAGER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 4. MAP SITE_ADMIN PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
  ON p.code IN (
      'REGISTRY_VIEW',
      'REGISTRY_MANAGE',
      'SITE_ADMIN_ACCESS',
      'SITE_STUDIES_VIEW',
      'SITE_STUDIES_CREATE',
      'SITE_ALL_STUDIES_MANAGE',
      'SITE_USERS_VIEW',
      'SITE_USERS_MANAGE',
      'SITE_ADMIN_USERS_MANAGE',
      'SITE_IMPORT_EXPORT',
      'SITE_AUDIT_LOG_VIEW',
      'SITE_SECURITY_MANAGE',
      'SITE_SETTINGS_VIEW',
      'SITE_SETTINGS_MANAGE'
  )
WHERE r.code = 'SITE_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
