-- EnrollNow
-- V8: Participant Core
--
-- A participant represents a person in the tenant-wide Registry.
--
-- Study-specific recruitment, screening, consent and enrollment
-- states are intentionally NOT stored here. Those relationships
-- will be introduced in subsequent migrations.
--
-- All participant-owned tables remain tenant-scoped and use
-- tenant-safe composite foreign keys.

SET search_path TO enrollnow, public;


-- ============================================================
-- PARTICIPANTS
-- ============================================================

CREATE TABLE participants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    /*
     * Optional primary/home site.
     *
     * A participant exists at tenant Registry level and is not
     * owned by a Study. This site identifies the participant's
     * primary operational location when applicable.
     */
    site_id                 UUID,

    first_name              VARCHAR(100) NOT NULL,
    middle_name             VARCHAR(100),
    last_name               VARCHAR(100) NOT NULL,
    preferred_name          VARCHAR(100),

    date_of_birth           DATE,

    /*
     * Values are intentionally not constrained yet because
     * customer terminology/configuration for sex/gender may vary.
     */
    sex_at_birth            VARCHAR(100),
    gender_identity         VARCHAR(100),

    /*
     * Administrative Registry status only.
     *
     * POTENTIAL / SCREENED / QUALIFIED / ENROLLED are
     * study-specific workflow states and belong elsewhere.
     */
    status                  VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    /*
     * Flexible participant-specific attributes that have not
     * justified fixed relational columns.
     *
     * Searchable/reportable core fields should NOT be moved here.
     */
    custom_attributes       JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_participants_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_participants_site_tenant
        FOREIGN KEY (tenant_id, site_id)
        REFERENCES sites(tenant_id, id),

    CONSTRAINT uk_participants_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_participants_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'DECEASED',
                'MERGED'
            )
        ),

    CONSTRAINT ck_participants_birth_date
        CHECK (
            date_of_birth IS NULL
            OR date_of_birth <= CURRENT_DATE
        )
);


CREATE INDEX ix_participants_tenant_name
    ON participants (
        tenant_id,
        last_name,
        first_name
    );


CREATE INDEX ix_participants_tenant_status
    ON participants (
        tenant_id,
        status
    );


CREATE INDEX ix_participants_tenant_site
    ON participants (
        tenant_id,
        site_id
    );


CREATE INDEX ix_participants_tenant_dob
    ON participants (
        tenant_id,
        date_of_birth
    );


-- ============================================================
-- PARTICIPANT IDENTIFIERS
--
-- Supports MRN, Registry ID, external system identifiers,
-- study-independent custom identifiers, etc.
--
-- Study-specific participant identifiers can reference this
-- participant later from the Study Enrollment model.
-- ============================================================

CREATE TABLE participant_identifiers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,

    identifier_type         VARCHAR(50) NOT NULL,
    identifier_value        VARCHAR(255) NOT NULL,

    issuing_system          VARCHAR(100),

    primary_identifier      BOOLEAN NOT NULL DEFAULT FALSE,
    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,

    CONSTRAINT fk_participant_identifiers_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_participant_identifiers_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_participant_identifiers_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_participant_identifier
        UNIQUE (
            tenant_id,
            identifier_type,
            identifier_value
        )
);


CREATE INDEX ix_participant_identifiers_participant
    ON participant_identifiers (
        tenant_id,
        participant_id
    );


CREATE INDEX ix_participant_identifiers_lookup
    ON participant_identifiers (
        tenant_id,
        identifier_value
    );


CREATE UNIQUE INDEX uk_participant_identifier_one_primary
    ON participant_identifiers (
        tenant_id,
        participant_id
    )
    WHERE primary_identifier = TRUE
      AND active = TRUE;


-- ============================================================
-- PARTICIPANT CONTACTS
--
-- Contact methods such as EMAIL and PHONE.
--
-- Generic contact table is intentional because EnrollNow may
-- support additional contact channels in the future.
-- ============================================================

CREATE TABLE participant_contacts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,

    contact_type            VARCHAR(30) NOT NULL,
    contact_value           VARCHAR(320) NOT NULL,

    label                   VARCHAR(50),

    primary_contact         BOOLEAN NOT NULL DEFAULT FALSE,
    verified                BOOLEAN NOT NULL DEFAULT FALSE,
    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_participant_contacts_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_participant_contacts_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_participant_contacts_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_participant_contact_value
        UNIQUE (
            tenant_id,
            participant_id,
            contact_type,
            contact_value
        ),

    CONSTRAINT ck_participant_contact_type
        CHECK (
            contact_type IN (
                'EMAIL',
                'PHONE',
                'SMS',
                'OTHER'
            )
        )
);


CREATE INDEX ix_participant_contacts_participant
    ON participant_contacts (
        tenant_id,
        participant_id
    );


CREATE INDEX ix_participant_contacts_lookup
    ON participant_contacts (
        tenant_id,
        contact_type,
        contact_value
    );


CREATE UNIQUE INDEX uk_participant_contact_one_primary_per_type
    ON participant_contacts (
        tenant_id,
        participant_id,
        contact_type
    )
    WHERE primary_contact = TRUE
      AND active = TRUE;


-- ============================================================
-- PARTICIPANT ADDRESSES
-- ============================================================

CREATE TABLE participant_addresses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,

    address_type            VARCHAR(30) NOT NULL DEFAULT 'HOME',

    address_line1           VARCHAR(255),
    address_line2           VARCHAR(255),
    city                    VARCHAR(100),
    state_region            VARCHAR(100),
    postal_code             VARCHAR(30),
    country_code            VARCHAR(3),

    primary_address         BOOLEAN NOT NULL DEFAULT FALSE,
    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_participant_addresses_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_participant_addresses_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_participant_addresses_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_participant_address_type
        CHECK (
            address_type IN (
                'HOME',
                'MAILING',
                'TEMPORARY',
                'OTHER'
            )
        )
);


CREATE INDEX ix_participant_addresses_participant
    ON participant_addresses (
        tenant_id,
        participant_id
    );


CREATE UNIQUE INDEX uk_participant_addresses_one_primary
    ON participant_addresses (
        tenant_id,
        participant_id
    )
    WHERE primary_address = TRUE
      AND active = TRUE;


-- ============================================================
-- PARTICIPANT PREFERENCES
--
-- One current preference/configuration record per participant.
-- ============================================================

CREATE TABLE participant_preferences (
    participant_id              UUID PRIMARY KEY,
    tenant_id                   UUID NOT NULL,

    preferred_language          VARCHAR(20),
    timezone                    VARCHAR(100),

    allow_email                 BOOLEAN NOT NULL DEFAULT TRUE,
    allow_sms                   BOOLEAN NOT NULL DEFAULT TRUE,
    allow_phone                 BOOLEAN NOT NULL DEFAULT TRUE,

    /*
     * Global communication suppression.
     *
     * A TRUE value means ordinary recruitment/engagement
     * communication should not be initiated.
     *
     * Regulatory/administrative exceptions belong in service
     * logic and should not be inferred from this flag alone.
     */
    do_not_contact              BOOLEAN NOT NULL DEFAULT FALSE,

    /*
     * Flexible preference/configuration fields that are not
     * stable enough for dedicated relational columns.
     */
    configuration               JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  UUID,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  UUID,

    CONSTRAINT fk_participant_preferences_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_participant_preferences_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_participant_preferences_tenant_id
        UNIQUE (tenant_id, participant_id)
);


-- ============================================================
-- PARTICIPANT STATUS HISTORY
--
-- Append-only history of Registry-level administrative status.
--
-- This is NOT Study candidate/enrollment history.
-- Study workflow history will be modeled separately.
-- ============================================================

CREATE TABLE participant_status_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    participant_id          UUID NOT NULL,

    previous_status         VARCHAR(30),
    new_status              VARCHAR(30) NOT NULL,

    reason                  VARCHAR(500),

    changed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by              UUID,

    CONSTRAINT fk_participant_status_history_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_participant_status_history_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_participant_status_history_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_participant_status_history_previous
        CHECK (
            previous_status IS NULL
            OR previous_status IN (
                'ACTIVE',
                'INACTIVE',
                'DECEASED',
                'MERGED'
            )
        ),

    CONSTRAINT ck_participant_status_history_new
        CHECK (
            new_status IN (
                'ACTIVE',
                'INACTIVE',
                'DECEASED',
                'MERGED'
            )
        )
);


CREATE INDEX ix_participant_status_history_participant
    ON participant_status_history (
        tenant_id,
        participant_id,
        changed_at DESC
    );