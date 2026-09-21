-- V2__rbac_and_authorization.sql
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_role_code ON roles(role_code);
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status);

CREATE TABLE IF NOT EXISTS user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON user_roles(status);

CREATE TABLE IF NOT EXISTS user_site_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_site UNIQUE (user_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_user_site_assignments_user_id ON user_site_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_site_assignments_site_id ON user_site_assignments(site_id);
CREATE INDEX IF NOT EXISTS idx_user_site_assignments_status ON user_site_assignments(status);

INSERT INTO roles (name, role_code, description, status)
VALUES 
    ('Super Administrator', 'ROLE_SUPER_ADMIN', 'Unrestricted system-wide identity, security governance, and global administration', 'ACTIVE'),
    ('Site Administrator', 'ROLE_SITE_ADMIN', 'Site-level user management, role assignments, and site operational settings', 'ACTIVE'),
    ('Site Manager', 'ROLE_SITE_MANAGER', 'Site coordinator and workflow management', 'ACTIVE'),
    ('Study Coordinator', 'ROLE_STUDY_USER', 'Study-specific participant recruitment and operational trial workflow', 'ACTIVE'),
    ('Registry User', 'ROLE_REGISTRY_USER', 'Participant registry search and intake operations', 'ACTIVE')
ON CONFLICT (role_code) DO NOTHING;
