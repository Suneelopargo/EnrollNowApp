-- V1__create_survey_schema.sql
-- EnrollNow Authoritative Survey & eConsent Studio Database Schema

-- 1. Surveys
CREATE TABLE IF NOT EXISTS surveys (
    id BIGSERIAL PRIMARY KEY,
    survey_code VARCHAR(64) NOT NULL UNIQUE,
    study_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    anonymous_responses BOOLEAN NOT NULL DEFAULT TRUE,
    allow_multiple_responses BOOLEAN NOT NULL DEFAULT FALSE,
    show_progress_bar BOOLEAN NOT NULL DEFAULT TRUE,
    thank_you_message TEXT DEFAULT 'Thank you for your valuable feedback!',
    is_global_submission BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_email_notification BOOLEAN NOT NULL DEFAULT FALSE,
    enable_econsent_countersign BOOLEAN NOT NULL DEFAULT FALSE,
    require_recaptcha BOOLEAN NOT NULL DEFAULT FALSE,
    public_token VARCHAR(64) NOT NULL UNIQUE,
    definition_json TEXT DEFAULT '{}',
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_surveys_code ON surveys(survey_code);
CREATE INDEX IF NOT EXISTS idx_surveys_public_token ON surveys(public_token);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_study_id ON surveys(study_id);

-- 2. Survey Versions (Snapshot ledger)
CREATE TABLE IF NOT EXISTS survey_versions (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    definition_json TEXT NOT NULL DEFAULT '{}',
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_by_user_id BIGINT,
    CONSTRAINT uq_survey_versions_survey_version UNIQUE (survey_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_survey_versions_survey_id ON survey_versions(survey_id);

-- 3. Survey Sections (Multi-step / Multi-page)
CREATE TABLE IF NOT EXISTS survey_sections (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_survey_sections_survey_id ON survey_sections(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_sections_pos ON survey_sections(survey_id, display_order);

-- 4. Questions
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    section_id BIGINT REFERENCES survey_sections(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    options_json TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_pos ON questions(survey_id, display_order);

-- 5. Question Options
CREATE TABLE IF NOT EXISTS question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

-- 6. Logic Rules (Conditional Display / Skip Logic)
CREATE TABLE IF NOT EXISTS logic_rules (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    if_question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    condition VARCHAR(30) NOT NULL DEFAULT 'is',
    value VARCHAR(255) NOT NULL,
    then_action VARCHAR(30) NOT NULL DEFAULT 'SHOW_QUESTION',
    then_question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logic_rules_survey_id ON logic_rules(survey_id);
CREATE INDEX IF NOT EXISTS idx_logic_rules_if_question_id ON logic_rules(if_question_id);

-- 7. Survey Assignments
CREATE TABLE IF NOT EXISTS survey_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT uq_survey_assignments_user_survey UNIQUE (user_id, survey_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_assignments_user_id ON survey_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_survey_id ON survey_assignments(survey_id);

-- 8. Responses
CREATE TABLE IF NOT EXISTS responses (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    survey_version_id BIGINT REFERENCES survey_versions(id) ON DELETE SET NULL,
    study_id BIGINT,
    participant_id BIGINT,
    user_id BIGINT,
    user_email VARCHAR(255),
    submission_type VARCHAR(30) NOT NULL DEFAULT 'EXTERNAL',
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    session_token VARCHAR(128),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_token ON responses(session_token);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);

-- 9. Response Answers
CREATE TABLE IF NOT EXISTS response_answers (
    id BIGSERIAL PRIMARY KEY,
    response_id BIGINT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_response_answers_response_id ON response_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_response_answers_question_id ON response_answers(question_id);

-- 10. Survey Audit Logs
CREATE TABLE IF NOT EXISTS survey_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT REFERENCES surveys(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    actor_user_id BIGINT,
    actor_username VARCHAR(100),
    correlation_id VARCHAR(64),
    ip_address VARCHAR(45),
    details_json TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survey_audit_logs_survey_id ON survey_audit_logs(survey_id);

-- Seed Initial Enterprise Clinical Study Questionnaires
INSERT INTO surveys (id, survey_code, study_id, title, description, status, anonymous_responses, allow_multiple_responses, show_progress_bar, thank_you_message, public_token, definition_json)
VALUES 
    (1, 'SRV-1001', 1, 'Cardiovascular Health Screening Assessment', 'Comprehensive baseline patient questionnaire for cardiac study eligibility and health metrics.', 'PUBLISHED', false, true, true, 'Thank you for completing the Cardiovascular Health Assessment. Your study coordinator will review your responses.', 'token-cardio-health-assessment-2026', '{"theme": "clinical"}'),
    (2, 'SRV-1002', 1, 'Pittsburgh Sleep Quality Index (PSQI)', 'Standardized 18-item clinical instrument evaluating sleep latency, duration, and disturbances.', 'PUBLISHED', false, true, true, 'Your sleep journal data has been securely recorded.', 'token-psqi-sleep-index-2026', '{"theme": "clinical"}'),
    (3, 'SRV-1003', 2, 'Adverse Event Follow-up Questionnaire', 'Daily diary for reporting adverse symptom onset, severity, and concomitant medications.', 'DRAFT', true, false, true, 'Thank you. If symptoms are severe, please contact the site investigator immediately.', 'token-adverse-event-diary-2026', '{"theme": "clinical"}')
ON CONFLICT (survey_code) DO NOTHING;

-- Reset sequence to prevent ID collisions
SELECT setval('surveys_id_seq', (SELECT MAX(id) FROM surveys));

-- Seed Sections
INSERT INTO survey_sections (id, survey_id, title, description, display_order)
VALUES 
    (1, 1, 'Demographics & Lifestyle', 'Basic patient demographic background and habits', 0),
    (2, 1, 'Cardiovascular Symptoms', 'Reported symptoms within the past 30 days', 1),
    (3, 2, 'Sleep Duration & Latency', 'Bedtime and hours of actual sleep per night', 0)
ON CONFLICT (id) DO NOTHING;

SELECT setval('survey_sections_id_seq', (SELECT MAX(id) FROM survey_sections));

-- Seed Questions for Survey 1
INSERT INTO questions (id, survey_id, section_id, display_order, type, text, required, options_json)
VALUES 
    (1, 1, 1, 0, 'Single Choice', 'What is your current overall health rating?', true, '["Excellent", "Very Good", "Good", "Fair", "Poor"]'),
    (2, 1, 1, 1, 'Multiple Choice', 'Which of the following conditions have you been diagnosed with?', false, '["Hypertension", "Hyperlipidemia", "Type 2 Diabetes", "Asthma", "None"]'),
    (3, 1, 1, 2, 'Rating', 'On a scale of 1 to 10, how would you rate your typical energy level throughout the day?', true, '["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]'),
    (4, 1, 2, 3, 'Yes / No', 'Have you experienced unexpected shortness of breath or chest discomfort in the last 14 days?', true, '["Yes", "No"]'),
    (5, 1, 2, 4, 'Paragraph', 'Please describe the frequency and severity of any chest discomfort symptoms you have experienced.', false, '[]'),
    (6, 1, 2, 5, 'Date', 'Date of your most recent blood pressure check:', false, '[]'),
    (7, 2, 3, 0, 'Number', 'During the past month, how many hours of actual sleep did you get at night on average?', true, '[]'),
    (8, 2, 3, 1, 'Dropdown', 'During the past month, how often have you had trouble sleeping because you cannot get to sleep within 30 minutes?', true, '["Not during the past month", "Less than once a week", "Once or twice a week", "Three or more times a week"]')
ON CONFLICT (id) DO NOTHING;

SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));

-- Seed Question Options
INSERT INTO question_options (question_id, label, value, display_order)
VALUES
    (1, 'Excellent', 'Excellent', 0),
    (1, 'Very Good', 'Very Good', 1),
    (1, 'Good', 'Good', 2),
    (1, 'Fair', 'Fair', 3),
    (1, 'Poor', 'Poor', 4),
    (2, 'Hypertension', 'Hypertension', 0),
    (2, 'Hyperlipidemia', 'Hyperlipidemia', 1),
    (2, 'Type 2 Diabetes', 'Type 2 Diabetes', 2),
    (2, 'Asthma', 'Asthma', 3),
    (2, 'None', 'None', 4),
    (4, 'Yes', 'Yes', 0),
    (4, 'No', 'No', 1),
    (8, 'Not during the past month', 'Not during the past month', 0),
    (8, 'Less than once a week', 'Less than once a week', 1),
    (8, 'Once or twice a week', 'Once or twice a week', 2),
    (8, 'Three or more times a week', 'Three or more times a week', 3)
ON CONFLICT DO NOTHING;

-- Seed Logic Rule (If Question 4 "Yes" -> Show Question 5)
INSERT INTO logic_rules (id, survey_id, if_question_id, condition, value, then_action, then_question_id)
VALUES 
    (1, 1, 4, 'is', 'Yes', 'SHOW_QUESTION', 5)
ON CONFLICT (id) DO NOTHING;

SELECT setval('logic_rules_id_seq', (SELECT MAX(id) FROM logic_rules));

-- Seed Published Version for Survey 1
INSERT INTO survey_versions (id, survey_id, version_number, definition_json, status, published_at, published_by_user_id)
VALUES 
    (1, 1, 1, '{"version": 1, "title": "Cardiovascular Health Screening Assessment", "questionsCount": 6}', 'PUBLISHED', CURRENT_TIMESTAMP, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('survey_versions_id_seq', (SELECT MAX(id) FROM survey_versions));
