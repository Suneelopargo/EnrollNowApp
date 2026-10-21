-- EnrollNow
-- V14: Documents
--
-- Stores document metadata and version history.
-- Actual file bytes should live in object storage, not PostgreSQL.
--
-- Typical storage example:
--   tenant/<tenant-id>/documents/<document-id>/<version-file>
--
-- All tenant-owned relationships use tenant-safe composite FKs.

SET search_path TO enrollnow, public;


-- ============================================================
-- DOCUMENTS
--
-- Logical document record.
--
-- Examples:
--   consent document
--   recruitment attachment
--   participant upload
--   study document
--   generated report/export
-- ============================================================

CREATE TABLE documents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    document_type           VARCHAR(50) NOT NULL,

    name                    VARCHAR(255) NOT NULL,
    description             TEXT,

    status                  VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    /*
     * Optional owner/uploader context.
     */
    created_by_user_id      UUID,

    /*
     * Flexible non-core metadata.
     */
    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_documents_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_documents_created_by_user_tenant
        FOREIGN KEY (tenant_id, created_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_documents_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_documents_status
        CHECK (
            status IN (
                'ACTIVE',
                'ARCHIVED',
                'DELETED'
            )
        )
);


CREATE INDEX ix_documents_type
    ON documents (
        tenant_id,
        document_type,
        active
    );


CREATE INDEX ix_documents_status
    ON documents (
        tenant_id,
        status
    );


-- ============================================================
-- DOCUMENT VERSIONS
--
-- Each uploaded/generated file version creates a new row.
--
-- Existing versions should not be overwritten.
-- ============================================================

CREATE TABLE document_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    document_id             UUID NOT NULL,

    version_number          INTEGER NOT NULL,

    file_name               VARCHAR(255) NOT NULL,
    mime_type               VARCHAR(150),

    file_size_bytes         BIGINT,

    /*
     * Object-storage reference.
     *
     * Example:
     * tenant/<tenant-id>/documents/<document-id>/v1/file.pdf
     */
    storage_provider        VARCHAR(50),
    storage_bucket          VARCHAR(255),
    storage_key             VARCHAR(1000) NOT NULL,

    /*
     * SHA-256 or equivalent content checksum.
     */
    checksum_algorithm      VARCHAR(30) DEFAULT 'SHA-256',
    checksum_value          VARCHAR(255),

    uploaded_by_user_id     UUID,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_document_versions_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_document_versions_document_tenant
        FOREIGN KEY (tenant_id, document_id)
        REFERENCES documents(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document_versions_user_tenant
        FOREIGN KEY (tenant_id, uploaded_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_document_versions_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_document_versions_number
        UNIQUE (
            tenant_id,
            document_id,
            version_number
        ),

    CONSTRAINT ck_document_versions_number
        CHECK (version_number > 0),

    CONSTRAINT ck_document_versions_size
        CHECK (
            file_size_bytes IS NULL
            OR file_size_bytes >= 0
        )
);


CREATE INDEX ix_document_versions_document
    ON document_versions (
        tenant_id,
        document_id,
        version_number DESC
    );


CREATE INDEX ix_document_versions_storage_key
    ON document_versions (
        tenant_id,
        storage_key
    );


-- ============================================================
-- DOCUMENT LINKS
--
-- Flexible relational linking between a Document and business
-- entities.
--
-- One document may be linked to more than one context.
--
-- We use explicit nullable FK columns instead of a polymorphic
-- entity_type/entity_id pair so referential integrity remains
-- enforceable by PostgreSQL.
-- ============================================================

CREATE TABLE document_links (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    document_id             UUID NOT NULL,

    study_id                UUID,
    participant_id          UUID,
    candidate_id            UUID,
    consent_id              UUID,
    enrollment_id           UUID,
    communication_id        UUID,
    task_id                 UUID,

    link_type               VARCHAR(50),

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,

    CONSTRAINT fk_document_links_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_document_links_document_tenant
        FOREIGN KEY (tenant_id, document_id)
        REFERENCES documents(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document_links_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_document_links_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_document_links_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id),

    CONSTRAINT fk_document_links_consent_tenant
        FOREIGN KEY (tenant_id, consent_id)
        REFERENCES consents(tenant_id, id),

    CONSTRAINT fk_document_links_enrollment_tenant
        FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES study_enrollments(tenant_id, id),

    CONSTRAINT fk_document_links_communication_tenant
        FOREIGN KEY (tenant_id, communication_id)
        REFERENCES communications(tenant_id, id),

    CONSTRAINT fk_document_links_task_tenant
        FOREIGN KEY (tenant_id, task_id)
        REFERENCES tasks(tenant_id, id),

    CONSTRAINT uk_document_links_tenant_id
        UNIQUE (tenant_id, id),

    /*
     * At least one business context must be present.
     */
    CONSTRAINT ck_document_links_context
        CHECK (
            study_id IS NOT NULL
            OR participant_id IS NOT NULL
            OR candidate_id IS NOT NULL
            OR consent_id IS NOT NULL
            OR enrollment_id IS NOT NULL
            OR communication_id IS NOT NULL
            OR task_id IS NOT NULL
        )
);


CREATE INDEX ix_document_links_document
    ON document_links (
        tenant_id,
        document_id
    );


CREATE INDEX ix_document_links_participant
    ON document_links (
        tenant_id,
        participant_id
    );


CREATE INDEX ix_document_links_study
    ON document_links (
        tenant_id,
        study_id
    );


CREATE INDEX ix_document_links_consent
    ON document_links (
        tenant_id,
        consent_id
    );


CREATE INDEX ix_document_links_enrollment
    ON document_links (
        tenant_id,
        enrollment_id
    );