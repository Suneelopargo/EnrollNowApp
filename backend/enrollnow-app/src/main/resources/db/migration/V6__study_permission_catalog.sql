-- ============================================================
-- EnrollNow Study Permission Catalog
--
-- These permissions are derived from the documented
-- Study Permission matrix:
--   READ_ONLY
--   RA
--   LEADER
--   ADMIN
--
-- Stable UUIDs are intentionally used for system permissions.
-- Application code should normally reference permission CODE,
-- not hard-code these UUID values.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Permission catalog
-- ------------------------------------------------------------

INSERT INTO enrollnow.permissions
(
    id,
    code,
    name,
    resource,
    action,
    description,
    created_at
)
VALUES

(
    '52000000-0000-0000-0000-000000000001',
    'STUDY_DASHBOARD_READ',
    'View Study Dashboard',
    'STUDY_DASHBOARD',
    'READ',
    'Allows viewing the study dashboard.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000002',
    'TASK_READ',
    'View Tasks',
    'TASK',
    'READ',
    'Allows viewing study tasks subject to applicable PHI restrictions.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000003',
    'RECRUITMENT_READ',
    'View Recruitment',
    'RECRUITMENT',
    'READ',
    'Allows viewing study recruitment information.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000004',
    'RECRUITMENT_MANAGE',
    'Manage Recruitment',
    'RECRUITMENT',
    'MANAGE',
    'Allows making changes to study recruitment information.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000005',
    'CALENDAR_READ',
    'View Calendar',
    'CALENDAR',
    'READ',
    'Allows viewing the study calendar subject to applicable PHI restrictions.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000006',
    'POTENTIAL_PARTICIPANT_READ',
    'View Potential Participants',
    'POTENTIAL_PARTICIPANT',
    'READ',
    'Allows viewing potential participant records.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000007',
    'POTENTIAL_PARTICIPANT_MANAGE',
    'Manage Potential Participants',
    'POTENTIAL_PARTICIPANT',
    'MANAGE',
    'Allows management of potential participant records.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000008',
    'ENROLLED_PARTICIPANT_READ',
    'View Enrolled Participants',
    'ENROLLED_PARTICIPANT',
    'READ',
    'Allows viewing enrolled participant records.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000009',
    'ENROLLED_PARTICIPANT_MANAGE',
    'Manage Enrolled Participants',
    'ENROLLED_PARTICIPANT',
    'MANAGE',
    'Allows management of enrolled participant records.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000010',
    'STUDY_SETTINGS_MANAGE',
    'Manage Study Settings',
    'STUDY_SETTINGS',
    'MANAGE',
    'Allows access to and management of study settings.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000011',
    'REPORT_READ',
    'View Study Reports',
    'REPORT',
    'READ',
    'Allows viewing study reports.',
    CURRENT_TIMESTAMP
),

(
    '52000000-0000-0000-0000-000000000012',
    'PHI_READ',
    'View Protected Health Information',
    'PHI',
    'READ',
    'Allows viewing participant-identifiable or protected health information where applicable.',
    CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2. READ-ONLY role
-- ------------------------------------------------------------
-- Documented:
-- Dashboard          Yes
-- Tasks              No
-- Recruitment        No
-- Calendar           Yes
-- Potential          Read-only
-- Enrolled           Read-only
-- Study Settings     No
-- Reports            View-only
--
-- PHI_READ is included because Read-Only has participant
-- viewing capability and is not documented with RA's
-- explicit "no PHI" restriction.
-- ------------------------------------------------------------

INSERT INTO enrollnow.role_permissions
(
    role_id,
    permission_id,
    created_at
)
SELECT
    r.id,
    p.id,
    CURRENT_TIMESTAMP
FROM enrollnow.roles r
JOIN enrollnow.permissions p
    ON p.code IN (
        'STUDY_DASHBOARD_READ',
        'CALENDAR_READ',
        'POTENTIAL_PARTICIPANT_READ',
        'ENROLLED_PARTICIPANT_READ',
        'REPORT_READ',
        'PHI_READ'
    )
WHERE r.code = 'STUDY_READ_ONLY';


-- ------------------------------------------------------------
-- 3. RA role
-- ------------------------------------------------------------
-- Documented:
-- Dashboard          Yes
-- Tasks              Yes, no PHI
-- Recruitment        Yes, cannot make changes
-- Calendar           Yes, no PHI
-- Potential          No
-- Enrolled           No
-- Study Settings     No
--
-- Therefore PHI_READ is intentionally NOT assigned.
-- ------------------------------------------------------------

INSERT INTO enrollnow.role_permissions
(
    role_id,
    permission_id,
    created_at
)
SELECT
    r.id,
    p.id,
    CURRENT_TIMESTAMP
FROM enrollnow.roles r
JOIN enrollnow.permissions p
    ON p.code IN (
        'STUDY_DASHBOARD_READ',
        'TASK_READ',
        'RECRUITMENT_READ',
        'CALENDAR_READ'
    )
WHERE r.code = 'STUDY_RA';


-- ------------------------------------------------------------
-- 4. LEADER role
-- ------------------------------------------------------------
-- Documented:
-- Dashboard          Yes
-- Tasks              Yes
-- Recruitment        Yes
-- Calendar           Yes
-- Potential          Yes
-- Enrolled           Yes
-- Study Settings     No
--
-- Recruitment MANAGE and participant MANAGE are included
-- because Leader is documented as an operational role
-- responsible for participant/day-to-day study activities.
-- ------------------------------------------------------------

INSERT INTO enrollnow.role_permissions
(
    role_id,
    permission_id,
    created_at
)
SELECT
    r.id,
    p.id,
    CURRENT_TIMESTAMP
FROM enrollnow.roles r
JOIN enrollnow.permissions p
    ON p.code IN (
        'STUDY_DASHBOARD_READ',
        'TASK_READ',
        'RECRUITMENT_READ',
        'RECRUITMENT_MANAGE',
        'CALENDAR_READ',
        'POTENTIAL_PARTICIPANT_READ',
        'POTENTIAL_PARTICIPANT_MANAGE',
        'ENROLLED_PARTICIPANT_READ',
        'ENROLLED_PARTICIPANT_MANAGE',
        'PHI_READ'
    )
WHERE r.code = 'STUDY_LEADER';


-- ------------------------------------------------------------
-- 5. ADMIN role
-- ------------------------------------------------------------
-- Admin has full study-level access including Study Settings.
-- ------------------------------------------------------------

INSERT INTO enrollnow.role_permissions
(
    role_id,
    permission_id,
    created_at
)
SELECT
    r.id,
    p.id,
    CURRENT_TIMESTAMP
FROM enrollnow.roles r
JOIN enrollnow.permissions p
    ON p.code IN (
        'STUDY_DASHBOARD_READ',
        'TASK_READ',
        'RECRUITMENT_READ',
        'RECRUITMENT_MANAGE',
        'CALENDAR_READ',
        'POTENTIAL_PARTICIPANT_READ',
        'POTENTIAL_PARTICIPANT_MANAGE',
        'ENROLLED_PARTICIPANT_READ',
        'ENROLLED_PARTICIPANT_MANAGE',
        'STUDY_SETTINGS_MANAGE',
        'REPORT_READ',
        'PHI_READ'
    )
WHERE r.code = 'STUDY_ADMIN';