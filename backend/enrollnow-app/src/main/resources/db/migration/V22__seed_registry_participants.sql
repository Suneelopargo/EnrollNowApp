-- EnrollNow
-- V22: Seed Registry Participants & Saved Searches for Demonstration & Verification
--
-- Inserts realistic participants with diverse demographics, contact details,
-- addresses, study assignments, and initial saved searches for the primary tenant.

SET search_path TO enrollnow, public;

DO $$
DECLARE
    v_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
    v_site_id UUID := '22222222-2222-2222-2222-222222222201';
    v_user_id UUID := '4e1941de-e712-4fe0-b0ea-845094e86349';

    v_p1_id UUID := '88888888-8888-8888-8888-000000000001';
    v_p2_id UUID := '88888888-8888-8888-8888-000000000002';
    v_p3_id UUID := '88888888-8888-8888-8888-000000000003';
    v_p4_id UUID := '88888888-8888-8888-8888-000000000004';
    v_p5_id UUID := '88888888-8888-8888-8888-000000000005';

    v_study_alpha UUID := '77777777-7777-7777-7777-777777777703';
    v_study_beta UUID := '77777777-7777-7777-7777-777777777704';
    v_study_hiv UUID := '77777777-7777-7777-7777-777777777701';
    v_study_mci UUID := '77777777-7777-7777-7777-777777777702';
    v_study_archived UUID := '77777777-7777-7777-7777-777777777705';
BEGIN
    -- Only seed if participants table has 0 rows for this tenant
    IF NOT EXISTS (SELECT 1 FROM participants WHERE tenant_id = v_tenant_id) THEN

        -- Participant 1: Drexel University AJDAI
        -- Active, Can be contacted (do_not_contact = false), Available for other studies (in alpha & hiv)
        INSERT INTO participants (id, tenant_id, site_id, first_name, middle_name, last_name, preferred_name, date_of_birth, sex_at_birth, gender_identity, status, custom_attributes, created_at)
        VALUES (
            v_p1_id, v_tenant_id, v_site_id,
            'Drexel', 'University', 'AJDAI', 'AJDAI',
            '1990-03-15', 'Male', 'Male', 'ACTIVE',
            '{"tags": ["Genomics Study", "Cohort Alpha", "High Priority"], "ethnicity": "Not Hispanic or Latino", "race": "White / Caucasian"}'::jsonb,
            now() - interval '120 days'
        );

        INSERT INTO participant_identifiers (tenant_id, participant_id, identifier_type, identifier_value, primary_identifier)
        VALUES 
            (v_tenant_id, v_p1_id, 'GLOBAL_ID', 'AJDAI', true),
            (v_tenant_id, v_p1_id, 'FAMILY_ID', 'FAM-84920', false);

        INSERT INTO participant_contacts (tenant_id, participant_id, contact_type, contact_value, label, primary_contact)
        VALUES 
            (v_tenant_id, v_p1_id, 'EMAIL', 'ajdai.registry@drexel.edu', 'Work', true),
            (v_tenant_id, v_p1_id, 'PHONE', '+1 (215) 895-2000', 'Office', true);

        INSERT INTO participant_addresses (tenant_id, participant_id, address_type, address_line1, city, state_region, postal_code, country_code, primary_address)
        VALUES 
            (v_tenant_id, v_p1_id, 'HOME', '3141 Chestnut St', 'Philadelphia', 'PA', '19104', 'USA', true);

        INSERT INTO participant_preferences (participant_id, tenant_id, preferred_language, timezone, allow_email, allow_sms, allow_phone, do_not_contact)
        VALUES 
            (v_p1_id, v_tenant_id, 'English', 'America/New_York (EDT)', true, true, true, false);

        INSERT INTO study_candidates (tenant_id, study_id, participant_id, status, active, first_contact_at, last_contact_at)
        VALUES 
            (v_tenant_id, v_study_alpha, v_p1_id, 'QUALIFIED', true, now() - interval '60 days', now() - interval '2 days'),
            (v_tenant_id, v_study_hiv, v_p1_id, 'SCREENING', true, now() - interval '45 days', now() - interval '5 days');


        -- Participant 2: Yihenew Abetu
        -- Active, Do Not Contact (do_not_contact = true), Available for other studies
        INSERT INTO participants (id, tenant_id, site_id, first_name, middle_name, last_name, preferred_name, date_of_birth, sex_at_birth, gender_identity, status, custom_attributes, created_at)
        VALUES (
            v_p2_id, v_tenant_id, v_site_id,
            'Yihenew', '', 'Abetu', 'Yihenew',
            '1985-07-22', 'Male', 'Male', 'ACTIVE',
            '{"tags": ["Biomarker Study", "Active Enrollment"], "ethnicity": "Not Hispanic or Latino", "race": "Black or African American"}'::jsonb,
            now() - interval '180 days'
        );

        INSERT INTO participant_identifiers (tenant_id, participant_id, identifier_type, identifier_value, primary_identifier)
        VALUES 
            (v_tenant_id, v_p2_id, 'GLOBAL_ID', 'YABETU', true),
            (v_tenant_id, v_p2_id, 'FAMILY_ID', 'FAM-39102', false);

        INSERT INTO participant_contacts (tenant_id, participant_id, contact_type, contact_value, label, primary_contact)
        VALUES 
            (v_tenant_id, v_p2_id, 'EMAIL', 'yihenew.abetu@example.org', 'Home', true),
            (v_tenant_id, v_p2_id, 'PHONE', '+1 (215) 555-0143', 'Mobile', true);

        INSERT INTO participant_addresses (tenant_id, participant_id, address_type, address_line1, city, state_region, postal_code, country_code, primary_address)
        VALUES 
            (v_tenant_id, v_p2_id, 'HOME', '240 S 40th St', 'Philadelphia', 'PA', '19104', 'USA', true);

        INSERT INTO participant_preferences (participant_id, tenant_id, preferred_language, timezone, allow_email, allow_sms, allow_phone, do_not_contact)
        VALUES 
            (v_p2_id, v_tenant_id, 'Amharic', 'America/New_York (EDT)', false, false, false, true);

        INSERT INTO study_candidates (tenant_id, study_id, participant_id, status, active, first_contact_at, last_contact_at)
        VALUES 
            (v_tenant_id, v_study_mci, v_p2_id, 'CONTACTED', true, now() - interval '90 days', now() - interval '15 days');


        -- Participant 3: Maria Rodriguez
        -- Active, Can be contacted (do_not_contact = false), NOT available for other studies (enrolled in STUDY_BETA which forbids other studies)
        INSERT INTO participants (id, tenant_id, site_id, first_name, middle_name, last_name, preferred_name, date_of_birth, sex_at_birth, gender_identity, status, custom_attributes, created_at)
        VALUES (
            v_p3_id, v_tenant_id, v_site_id,
            'Maria', 'Elena', 'Rodriguez', 'Maria',
            '1992-11-04', 'Female', 'Female', 'ACTIVE',
            '{"tags": ["Pediatric Genetics", "Neurology Focus"], "ethnicity": "Hispanic or Latino", "race": "White / Hispanic"}'::jsonb,
            now() - interval '240 days'
        );

        INSERT INTO participant_identifiers (tenant_id, participant_id, identifier_type, identifier_value, primary_identifier)
        VALUES 
            (v_tenant_id, v_p3_id, 'GLOBAL_ID', 'MRODRIGUEZ', true),
            (v_tenant_id, v_p3_id, 'FAMILY_ID', 'FAM-55410', false);

        INSERT INTO participant_contacts (tenant_id, participant_id, contact_type, contact_value, label, primary_contact)
        VALUES 
            (v_tenant_id, v_p3_id, 'EMAIL', 'maria.rodriguez@clinres.org', 'Personal', true),
            (v_tenant_id, v_p3_id, 'PHONE', '+1 (312) 555-0188', 'Mobile', true);

        INSERT INTO participant_addresses (tenant_id, participant_id, address_type, address_line1, city, state_region, postal_code, country_code, primary_address)
        VALUES 
            (v_tenant_id, v_p3_id, 'HOME', '500 N Michigan Ave', 'Chicago', 'IL', '60611', 'USA', true);

        INSERT INTO participant_preferences (participant_id, tenant_id, preferred_language, timezone, allow_email, allow_sms, allow_phone, do_not_contact)
        VALUES 
            (v_p3_id, v_tenant_id, 'Spanish', 'America/Chicago (CDT)', true, true, true, false);

        INSERT INTO study_candidates (tenant_id, study_id, participant_id, status, active, first_contact_at, last_contact_at)
        VALUES 
            (v_tenant_id, v_study_beta, v_p3_id, 'QUALIFIED', true, now() - interval '100 days', now() - interval '10 days');


        -- Participant 4: Chen Wei
        -- Active, Can be contacted (do_not_contact = false), Available for other studies (enrolled in STUDY_ARCHIVED)
        INSERT INTO participants (id, tenant_id, site_id, first_name, middle_name, last_name, preferred_name, date_of_birth, sex_at_birth, gender_identity, status, custom_attributes, created_at)
        VALUES (
            v_p4_id, v_tenant_id, v_site_id,
            'Chen', '', 'Wei', 'Wei',
            '1978-01-18', 'Male', 'Male', 'ACTIVE',
            '{"tags": ["Longitudinal Cohort", "Cardiovascular"], "ethnicity": "Not Hispanic or Latino", "race": "Asian"}'::jsonb,
            now() - interval '300 days'
        );

        INSERT INTO participant_identifiers (tenant_id, participant_id, identifier_type, identifier_value, primary_identifier)
        VALUES 
            (v_tenant_id, v_p4_id, 'GLOBAL_ID', 'CWEI', true),
            (v_tenant_id, v_p4_id, 'FAMILY_ID', 'FAM-78214', false);

        INSERT INTO participant_contacts (tenant_id, participant_id, contact_type, contact_value, label, primary_contact)
        VALUES 
            (v_tenant_id, v_p4_id, 'EMAIL', 'chen.wei@healthresearch.net', 'Home', true),
            (v_tenant_id, v_p4_id, 'PHONE', '+1 (206) 555-0199', 'Mobile', true);

        INSERT INTO participant_addresses (tenant_id, participant_id, address_type, address_line1, city, state_region, postal_code, country_code, primary_address)
        VALUES 
            (v_tenant_id, v_p4_id, 'HOME', '1201 3rd Ave', 'Seattle', 'WA', '98101', 'USA', true);

        INSERT INTO participant_preferences (participant_id, tenant_id, preferred_language, timezone, allow_email, allow_sms, allow_phone, do_not_contact)
        VALUES 
            (v_p4_id, v_tenant_id, 'Mandarin', 'America/Los_Angeles (PDT)', true, false, true, false);

        INSERT INTO study_candidates (tenant_id, study_id, participant_id, status, active, first_contact_at, last_contact_at)
        VALUES 
            (v_tenant_id, v_study_archived, v_p4_id, 'QUALIFIED', true, now() - interval '200 days', now() - interval '40 days');


        -- Participant 5: Sarah Connor
        -- Active, Can be contacted (do_not_contact = false), Available for other studies (in no studies)
        INSERT INTO participants (id, tenant_id, site_id, first_name, middle_name, last_name, preferred_name, date_of_birth, sex_at_birth, gender_identity, status, custom_attributes, created_at)
        VALUES (
            v_p5_id, v_tenant_id, v_site_id,
            'Sarah', 'Jean', 'Connor', 'Sarah',
            '1989-05-12', 'Female', 'Female', 'ACTIVE',
            '{"tags": ["Volunteer Registry", "Healthy Control"], "ethnicity": "Not Hispanic or Latino", "race": "White / Caucasian"}'::jsonb,
            now() - interval '30 days'
        );

        INSERT INTO participant_identifiers (tenant_id, participant_id, identifier_type, identifier_value, primary_identifier)
        VALUES 
            (v_tenant_id, v_p5_id, 'GLOBAL_ID', 'SCONNOR', true),
            (v_tenant_id, v_p5_id, 'FAMILY_ID', 'FAM-10294', false);

        INSERT INTO participant_contacts (tenant_id, participant_id, contact_type, contact_value, label, primary_contact)
        VALUES 
            (v_tenant_id, v_p5_id, 'EMAIL', 'sconnor@cyberdyne.org', 'Home', true),
            (v_tenant_id, v_p5_id, 'PHONE', '+1 (310) 555-0144', 'Mobile', true);

        INSERT INTO participant_addresses (tenant_id, participant_id, address_type, address_line1, city, state_region, postal_code, country_code, primary_address)
        VALUES 
            (v_tenant_id, v_p5_id, 'HOME', '100 Wilshire Blvd', 'Los Angeles', 'CA', '90401', 'USA', true);

        INSERT INTO participant_preferences (participant_id, tenant_id, preferred_language, timezone, allow_email, allow_sms, allow_phone, do_not_contact)
        VALUES 
            (v_p5_id, v_tenant_id, 'English', 'America/Los_Angeles (PDT)', true, true, true, false);

        -- Seed initial saved searches for demo user
        INSERT INTO registry_saved_searches (tenant_id, user_id, name, search_criteria)
        VALUES 
            (v_tenant_id, v_user_id, 'Cognitive Aging Candidates', '{"contactFilter": "all", "availableFilter": "yes", "searchTerm": "", "selectedStudies": ["Cognitive Aging Study"], "customFilters": []}'::jsonb),
            (v_tenant_id, v_user_id, 'Do Not Contact Group', '{"contactFilter": "no", "availableFilter": "all", "searchTerm": "", "selectedStudies": [], "customFilters": [{"id": "1", "field": "gender", "operator": "equal to", "value": "Male"}]}'::jsonb);

    END IF;
END $$;
