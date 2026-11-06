-- EnrollNow
-- V21: Registry Saved Searches
--
-- Persists user-defined saved search filters for the Master Participant Registry.
-- Saved searches are scoped to tenant and user.

SET search_path TO enrollnow, public;

CREATE TABLE registry_saved_searches (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    user_id                 UUID NOT NULL,

    name                    VARCHAR(150) NOT NULL,
    search_criteria         JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_registry_saved_searches_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_registry_saved_searches_user
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_registry_saved_searches_tenant_user_name
        UNIQUE (tenant_id, user_id, name)
);

CREATE INDEX ix_registry_saved_searches_user
    ON registry_saved_searches (tenant_id, user_id);

CREATE INDEX ix_registry_saved_searches_tenant_created
    ON registry_saved_searches (tenant_id, created_at DESC);
