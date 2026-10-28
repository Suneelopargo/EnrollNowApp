-- EnrollNow
-- V23: Study Name Case-Insensitive Uniqueness Index

SET search_path TO enrollnow, public;

CREATE UNIQUE INDEX IF NOT EXISTS ix_studies_tenant_name_lower
    ON studies (tenant_id, lower(name));
