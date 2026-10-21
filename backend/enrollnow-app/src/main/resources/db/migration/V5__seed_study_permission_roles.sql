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
    '51000000-0000-0000-0000-000000000001',
    'STUDY_READ_ONLY',
    'Study Read-Only',
    'STUDY',
    'View-only access to permitted study data and functionality.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '51000000-0000-0000-0000-000000000002',
    'STUDY_RA',
    'Study Restricted Access',
    'STUDY',
    'Restricted study access intended for limited or de-identified study functionality.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '51000000-0000-0000-0000-000000000003',
    'STUDY_LEADER',
    'Study Leader',
    'STUDY',
    'Operational access to participant and study activities without Study Settings administration.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '51000000-0000-0000-0000-000000000004',
    'STUDY_ADMIN',
    'Study Admin',
    'STUDY',
    'Full study-level access including Study Settings.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);