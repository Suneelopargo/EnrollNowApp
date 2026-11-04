SET search_path TO enrollnow, public;

CREATE TABLE tenant_contact_taxonomy_options (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    taxonomy_type   VARCHAR(30) NOT NULL,
    option_value    VARCHAR(255) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_tenant_contact_taxonomy_type
        CHECK (taxonomy_type IN ('RELATIONSHIP', 'OUTCOME'))
);

CREATE INDEX ix_tenant_contact_taxonomy_active
    ON tenant_contact_taxonomy_options (tenant_id, taxonomy_type, active, sort_order);

CREATE UNIQUE INDEX ux_tenant_contact_taxonomy_value
    ON tenant_contact_taxonomy_options (tenant_id, taxonomy_type, LOWER(option_value));

WITH option_sources AS (
    SELECT sr.tenant_id, 'RELATIONSHIP', COALESCE(item->>'relationship', item->>'value', item->>'name'), 0
    FROM study_requirements sr
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(sr.configuration->'contactRelationships') = 'array'
            THEN sr.configuration->'contactRelationships' ELSE '[]'::jsonb END
    ) AS rel_items(item)
    WHERE NULLIF(BTRIM(COALESCE(item->>'relationship', item->>'value', item->>'name')), '') IS NOT NULL

    UNION ALL

    SELECT tenant_id, 'RELATIONSHIP', BTRIM(relationship), 1
    FROM participant_contacts
    WHERE NULLIF(BTRIM(relationship), '') IS NOT NULL

    UNION ALL

    SELECT sr.tenant_id, 'OUTCOME', COALESCE(item->>'outcome', item->>'value', item->>'name'), 0
    FROM study_requirements sr
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(sr.configuration->'contactOutcomes') = 'array'
            THEN sr.configuration->'contactOutcomes' ELSE '[]'::jsonb END
    ) AS outcome_items(item)
    WHERE NULLIF(BTRIM(COALESCE(item->>'outcome', item->>'value', item->>'name')), '') IS NOT NULL

    UNION ALL

    SELECT tenant_id, 'OUTCOME', BTRIM(outcome), 1
    FROM contact_outcomes
    WHERE active = TRUE AND NULLIF(BTRIM(outcome), '') IS NOT NULL

    UNION ALL

    SELECT tenant_id, 'OUTCOME', BTRIM(outcome), 2
    FROM participant_contact_logs
    WHERE NULLIF(BTRIM(outcome), '') IS NOT NULL
),
deduplicated AS (
    SELECT tenant_id, taxonomy_type, option_value, source_order,
           ROW_NUMBER() OVER (
               PARTITION BY tenant_id, taxonomy_type, LOWER(option_value)
               ORDER BY source_order, option_value
           ) AS duplicate_rank
    FROM option_sources
    WHERE NULLIF(BTRIM(option_value), '') IS NOT NULL
),
ordered AS (
    SELECT tenant_id, taxonomy_type, BTRIM(option_value) AS option_value,
           ROW_NUMBER() OVER (
               PARTITION BY tenant_id, taxonomy_type
               ORDER BY source_order, option_value
           ) - 1 AS sort_order
    FROM deduplicated
    WHERE duplicate_rank = 1
)
INSERT INTO tenant_contact_taxonomy_options (tenant_id, taxonomy_type, option_value, sort_order)
SELECT tenant_id, taxonomy_type, option_value, sort_order
FROM ordered
ON CONFLICT DO NOTHING;
