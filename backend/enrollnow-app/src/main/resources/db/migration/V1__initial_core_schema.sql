-- V1__initial_core_schema.sql
-- EnrollNow Core Schema: Organizations, Sites, and Users

-- 1. Organizations
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    org_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_org_code ON organizations(org_code);
CREATE INDEX idx_organizations_status ON organizations(status);

-- 2. Sites (EnrollNow site concept; NOT HMIS locations)
CREATE TABLE sites (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
    site_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(250),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sites_site_code ON sites(site_code);
CREATE INDEX idx_sites_organization_id ON sites(organization_id);
CREATE INDEX idx_sites_status ON sites(status);

-- 3. Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- Initial default research network seed
INSERT INTO organizations (name, org_code, description, status)
VALUES ('EnrollNow Research Network', 'EN-RESEARCH', 'Authoritative clinical trial recruitment and participant network', 'ACTIVE')
ON CONFLICT (org_code) DO NOTHING;

INSERT INTO sites (organization_id, site_code, name, address_line1, city, state, country, postal_code, status)
SELECT id, 'SITE-001', 'Main Clinical Research Center', '100 Innovation Parkway', 'Boston', 'MA', 'USA', '02115', 'ACTIVE'
FROM organizations WHERE org_code = 'EN-RESEARCH'
ON CONFLICT (site_code) DO NOTHING;
