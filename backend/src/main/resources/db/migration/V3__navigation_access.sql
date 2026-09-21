-- V3__navigation_access.sql
-- Dynamic Navigation Modules, Links, and Granular Role Access Matrix

-- 1. Navigation Modules
CREATE TABLE navigation_modules (
    id SERIAL PRIMARY KEY,
    module_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    short_title VARCHAR(50),
    icon VARCHAR(50) DEFAULT 'Folder',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nav_modules_code ON navigation_modules(module_code);
CREATE INDEX idx_nav_modules_order ON navigation_modules(display_order);

-- 2. Navigation Links
CREATE TABLE navigation_links (
    id SERIAL PRIMARY KEY,
    module_id INT NOT NULL REFERENCES navigation_modules(id) ON DELETE CASCADE,
    link_code VARCHAR(60) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    path VARCHAR(200) NOT NULL,
    icon VARCHAR(50) DEFAULT 'FileText',
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nav_links_code ON navigation_links(link_code);
CREATE INDEX idx_nav_links_module_id ON navigation_links(module_id);
CREATE INDEX idx_nav_links_order ON navigation_links(display_order);

-- 3. Role Link Access Matrix (View, Create, Edit, Delete, Export permissions)
CREATE TABLE role_link_access (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    link_id INT NOT NULL REFERENCES navigation_links(id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    can_export BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_link_access UNIQUE (role_id, link_id)
);

CREATE INDEX idx_role_link_access_role_id ON role_link_access(role_id);
CREATE INDEX idx_role_link_access_link_id ON role_link_access(link_id);
CREATE INDEX idx_role_link_access_status ON role_link_access(status);

-- Seed Navigation Modules
INSERT INTO navigation_modules (module_code, title, short_title, icon, display_order, is_active)
VALUES 
    ('MODULE_ADMIN', 'System Administration', 'Admin', 'Settings', 100, true),
    ('MODULE_STUDIES', 'Study Management', 'Studies', 'BookOpen', 10, true),
    ('MODULE_PARTICIPANTS', 'Participants & Enrollment', 'Participants', 'Users', 20, true),
    ('MODULE_REGISTRY', 'Participant Registry', 'Registry', 'Database', 30, true),
    ('MODULE_SURVEYS', 'Surveys & Forms', 'Surveys', 'ClipboardList', 40, true),
    ('MODULE_REPORTS', 'Analytics & Reports', 'Reports', 'BarChart2', 50, true)
ON CONFLICT (module_code) DO NOTHING;

-- Seed Navigation Links
INSERT INTO navigation_links (module_id, link_code, title, path, icon, description, display_order, is_active)
SELECT m.id, l.link_code, l.title, l.path, l.icon, l.description, l.display_order, true
FROM navigation_modules m
CROSS JOIN (
    VALUES 
        ('MODULE_ADMIN', 'LINK_ADMIN_DASHBOARD', 'Admin Overview', '/admin', 'LayoutDashboard', 'Administrative KPI metrics and system summary', 1),
        ('MODULE_ADMIN', 'LINK_ADMIN_USERS', 'User Management', '/admin/users', 'UserCheck', 'Manage accounts, activation, and role assignments', 2),
        ('MODULE_ADMIN', 'LINK_ADMIN_ROLES', 'Roles & RBAC', '/admin/roles', 'Shield', 'Manage roles and dynamic permission matrices', 3),
        ('MODULE_ADMIN', 'LINK_ADMIN_SITES', 'Site Management', '/admin/sites', 'Building', 'Configure research facility sites and access', 4),
        ('MODULE_ADMIN', 'LINK_ADMIN_AUDIT', 'Audit Ledger', '/admin/audit-logs', 'ScrollText', 'Security and administrative audit trail', 5),
        ('MODULE_STUDIES', 'LINK_STUDIES_LIST', 'Studies Overview', '/studies', 'List', 'Clinical trials and study setup', 1),
        ('MODULE_PARTICIPANTS', 'LINK_PARTICIPANTS_LIST', 'Participant Queue', '/participants', 'UserPlus', 'Participant recruitment and screening', 1),
        ('MODULE_REGISTRY', 'LINK_REGISTRY_SEARCH', 'Registry Intake', '/registry', 'Search', 'Central participant registry', 1),
        ('MODULE_SURVEYS', 'LINK_SURVEYS_BUILDER', 'Survey Studio', '/surveys', 'FileQuestion', 'Survey and eConsent builder', 1),
        ('MODULE_REPORTS', 'LINK_REPORTS_DASHBOARD', 'Analytics', '/reports', 'TrendingUp', 'Reporting and recruitment metrics', 1)
) AS l(module_code, link_code, title, path, icon, description, display_order)
WHERE m.module_code = l.module_code
ON CONFLICT (link_code) DO NOTHING;

-- Seed Default Matrix Permissions
-- Super Admin has full permissions across all screens
INSERT INTO role_link_access (role_id, link_id, can_view, can_create, can_edit, can_delete, can_export, status)
SELECT r.id, l.id, true, true, true, true, true, 'ACTIVE'
FROM roles r
CROSS JOIN navigation_links l
WHERE r.role_code = 'ROLE_SUPER_ADMIN'
ON CONFLICT (role_id, link_id) DO UPDATE SET
    can_view = true, can_create = true, can_edit = true, can_delete = true, can_export = true;

-- Site Admin has administrative permissions without global deletion
INSERT INTO role_link_access (role_id, link_id, can_view, can_create, can_edit, can_delete, can_export, status)
SELECT r.id, l.id, true, true, true, false, true, 'ACTIVE'
FROM roles r
CROSS JOIN navigation_links l
WHERE r.role_code = 'ROLE_SITE_ADMIN'
ON CONFLICT (role_id, link_id) DO UPDATE SET
    can_view = true, can_create = true, can_edit = true, can_delete = false, can_export = true;
