-- Tenant-scoped defaults for participant and registry dropdowns.
SET search_path TO enrollnow, public;

CREATE TABLE tenant_option_catalog (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category    VARCHAR(50) NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uq_tenant_option_catalog_value
    ON tenant_option_catalog (tenant_id, category, lower(option_value));

CREATE INDEX ix_tenant_option_catalog_lookup
    ON tenant_option_catalog (tenant_id, category, active, sort_order, option_value);

CREATE OR REPLACE FUNCTION enrollnow.seed_default_tenant_options()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO enrollnow.tenant_option_catalog (tenant_id, category, option_value, sort_order)
    VALUES
        (NEW.id, 'CONTACT_TYPE', 'Phone Call', 10),
        (NEW.id, 'CONTACT_TYPE', 'Email', 20),
        (NEW.id, 'CONTACT_TYPE', 'Text Message', 30),
        (NEW.id, 'CONTACT_TYPE', 'In Person', 40),
        (NEW.id, 'CONTACT_TYPE', 'Appointment', 50),
        (NEW.id, 'CONTACT_TYPE', 'No Show', 60),
        (NEW.id, 'CONTACT_TYPE', 'Other', 70),
        (NEW.id, 'CONSENT_TYPE', 'Initial Consent', 10),
        (NEW.id, 'CONSENT_TYPE', 'Re-Consent', 20),
        (NEW.id, 'CONSENT_TYPE', 'Assent', 30),
        (NEW.id, 'CONSENT_TYPE', 'Re-Assent', 40),
        (NEW.id, 'CONSENT_TYPE', 'Age of Majority', 50),
        (NEW.id, 'CONSENT_TYPE', 'Other', 60),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Self', 10),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Mother', 20),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Father', 30),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Parent / Guardian', 40),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Spouse / Partner', 50),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Sibling', 60),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Child', 70),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Caregiver', 80),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Friend', 90),
        (NEW.id, 'CONTACT_RELATIONSHIP', 'Other', 100),
        (NEW.id, 'SEX', 'Female', 10),
        (NEW.id, 'SEX', 'Male', 20),
        (NEW.id, 'SEX', 'Other', 30),
        (NEW.id, 'SEX', 'Unspecified', 40),
        (NEW.id, 'ETHNICITY', 'Hispanic or Latino', 10),
        (NEW.id, 'ETHNICITY', 'Not Hispanic or Latino', 20),
        (NEW.id, 'ETHNICITY', 'Unknown / Not Reported', 30),
        (NEW.id, 'RACE', 'American Indian', 10),
        (NEW.id, 'RACE', 'American Indian or Alaska Native', 20),
        (NEW.id, 'RACE', 'Asian', 30),
        (NEW.id, 'RACE', 'Black / African American', 40),
        (NEW.id, 'RACE', 'Black or African American', 50),
        (NEW.id, 'RACE', 'Hawaiian', 60),
        (NEW.id, 'RACE', 'Native Hawaiian or Other Pacific Islander', 70),
        (NEW.id, 'RACE', 'White', 80),
        (NEW.id, 'RACE', 'More Than One Race', 90),
        (NEW.id, 'RACE', 'Unknown / Not Reported', 100)
    ON CONFLICT DO NOTHING;

    INSERT INTO enrollnow.contact_outcomes (tenant_id, outcome)
    VALUES
        (NEW.id, 'No Answer, Left Message'),
        (NEW.id, 'No Answer, No Message'),
        (NEW.id, 'Left Voicemail'),
        (NEW.id, 'Spoke to patient'),
        (NEW.id, 'Appointment Scheduled'),
        (NEW.id, 'Confirmed Appointment'),
        (NEW.id, 'Screening Completed'),
        (NEW.id, 'Appointment Completed'),
        (NEW.id, 'Not Interested'),
        (NEW.id, 'Requested Call Back'),
        (NEW.id, 'Wrong Number'),
        (NEW.id, 'Disconnected Number')
    ON CONFLICT (tenant_id, outcome) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_default_tenant_options
AFTER INSERT ON enrollnow.tenants
FOR EACH ROW
EXECUTE FUNCTION enrollnow.seed_default_tenant_options();

INSERT INTO tenant_option_catalog (tenant_id, category, option_value, sort_order)
SELECT tenant.id, options.category, options.option_value, options.sort_order
FROM tenants tenant
CROSS JOIN (
    VALUES
        ('CONTACT_TYPE', 'Phone Call', 10),
        ('CONTACT_TYPE', 'Email', 20),
        ('CONTACT_TYPE', 'Text Message', 30),
        ('CONTACT_TYPE', 'In Person', 40),
        ('CONTACT_TYPE', 'Appointment', 50),
        ('CONTACT_TYPE', 'No Show', 60),
        ('CONTACT_TYPE', 'Other', 70),
        ('CONSENT_TYPE', 'Initial Consent', 10),
        ('CONSENT_TYPE', 'Re-Consent', 20),
        ('CONSENT_TYPE', 'Assent', 30),
        ('CONSENT_TYPE', 'Re-Assent', 40),
        ('CONSENT_TYPE', 'Age of Majority', 50),
        ('CONSENT_TYPE', 'Other', 60),
        ('CONTACT_RELATIONSHIP', 'Self', 10),
        ('CONTACT_RELATIONSHIP', 'Mother', 20),
        ('CONTACT_RELATIONSHIP', 'Father', 30),
        ('CONTACT_RELATIONSHIP', 'Parent / Guardian', 40),
        ('CONTACT_RELATIONSHIP', 'Spouse / Partner', 50),
        ('CONTACT_RELATIONSHIP', 'Sibling', 60),
        ('CONTACT_RELATIONSHIP', 'Child', 70),
        ('CONTACT_RELATIONSHIP', 'Caregiver', 80),
        ('CONTACT_RELATIONSHIP', 'Friend', 90),
        ('CONTACT_RELATIONSHIP', 'Other', 100),
        ('SEX', 'Female', 10),
        ('SEX', 'Male', 20),
        ('SEX', 'Other', 30),
        ('SEX', 'Unspecified', 40),
        ('ETHNICITY', 'Hispanic or Latino', 10),
        ('ETHNICITY', 'Not Hispanic or Latino', 20),
        ('ETHNICITY', 'Unknown / Not Reported', 30),
        ('RACE', 'American Indian', 10),
        ('RACE', 'American Indian or Alaska Native', 20),
        ('RACE', 'Asian', 30),
        ('RACE', 'Black / African American', 40),
        ('RACE', 'Black or African American', 50),
        ('RACE', 'Hawaiian', 60),
        ('RACE', 'Native Hawaiian or Other Pacific Islander', 70),
        ('RACE', 'White', 80),
        ('RACE', 'More Than One Race', 90),
        ('RACE', 'Unknown / Not Reported', 100)
) AS options(category, option_value, sort_order)
ON CONFLICT DO NOTHING;

INSERT INTO contact_outcomes (tenant_id, outcome)
SELECT tenant.id, options.outcome
FROM tenants tenant
CROSS JOIN (
    VALUES
        ('No Answer, Left Message'),
        ('No Answer, No Message'),
        ('Left Voicemail'),
        ('Spoke to patient'),
        ('Appointment Scheduled'),
        ('Confirmed Appointment'),
        ('Screening Completed'),
        ('Appointment Completed'),
        ('Not Interested'),
        ('Requested Call Back'),
        ('Wrong Number'),
        ('Disconnected Number')
) AS options(outcome)
ON CONFLICT (tenant_id, outcome) DO NOTHING;
