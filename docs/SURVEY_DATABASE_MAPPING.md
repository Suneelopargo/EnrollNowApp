# Survey Database Schema Mapping

This document provides the authoritative database mapping between the **Survey POC Database** (`Surverydbdump.sql` / `surveydb.sql`) and the target **EnrollNow Enterprise PostgreSQL Database** (`enrollnowdb`).

## Database Context Comparison

| Attribute | Survey POC Database (`surveydb.sql`) | Target EnrollNow Database (`enrollnowdb`) |
|---|---|---|
| **Architecture** | Monolithic combined schema | Distributed Domain-Driven Microservices Schema |
| **Primary Keys** | `integer` (4-byte sequences) | `BIGINT` / `BIGSERIAL` (8-byte standard) |
| **Timestamp Format** | Mixed timestamp with time zone | Standard ISO-8601 `TIMESTAMP WITH TIME ZONE` |
| **Survey Domain Tables** | 10 Survey-related tables | **Authoritative Survey Domain Service** (`enrollnow-survey-service`) |
| **Schema Governance** | Alembic migrations | Flyway migrations (`db/migration/V...__*.sql`) |

---

## Complete Table-by-Table Mapping

| Survey POC Table | Existing EnrollNow Table | Target Service | Action | Reason & Strategy |
|---|---|---|---|---|
| `surveys` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Authoritative survey header, metadata, lifecycle status, anonymous flags, and public access token. |
| `survey_versions` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Immutable version snapshot ledger for published survey instruments. |
| `survey_sections` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Survey multi-page/section structures and step ordering. |
| `questions` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Authoritative questions entity supporting all 16 clinical question types and required flags. |
| `question_options` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Choice options for single-choice, multiple-choice, dropdown, and matrix questions. |
| `logic_rules` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Conditional skip and branching rules linking trigger questions to target questions. |
| `survey_assignments` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Mapping table assigning surveys to participants/users. |
| `responses` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Submission session headers, completion timing, and respondent references. |
| `response_answers` | *None* | `enrollnow-survey-service` | **NEW TABLE** | Granular typed answer payloads stored per question in JSON format. |
| `audit_logs` | `admin_audit_logs` | `enrollnow-survey-service` | **NEW TABLE** (`survey_audit_logs`) | Domain-isolated survey audit ledger preserving audit trail without cross-service database coupling. |
| `users` | `users` | `enrollnow-identity-service` | **REUSE** | Users table already exists in EnrollNow core; survey references `user_id` logically. |
| `organizations` | `organizations` | `enrollnow-identity-service` | **REUSE** | Organizations table already exists in EnrollNow core schema. |
| `sites` | `sites` | `enrollnow-identity-service` | **REUSE** | Clinical research sites exist in EnrollNow core schema. |
| `studies` | `studies` | `enrollnow-study-service` | **NOT REQUIRED IN SURVEY SERVICE** | Study entities are managed authoritatively by `enrollnow-study-service`. |
| `participants` | `participants` | `enrollnow-participant-service` | **NOT REQUIRED IN SURVEY SERVICE** | Participants are managed authoritatively by `enrollnow-participant-service`. |
| `tasks` / `bulk_task_groups` | `tasks` | `enrollnow-task-service` | **NOT REQUIRED IN SURVEY SERVICE** | Tasks are managed authoritatively by `enrollnow-task-service`. |
| `communication_logs` / `templates` | `communications` | `enrollnow-communication-service`| **NOT REQUIRED IN SURVEY SERVICE** | Communications managed by communication service. |
| `documents` | `documents` | `enrollnow-document-service` | **NOT REQUIRED IN SURVEY SERVICE** | Document storage managed by document service. |
| `alembic_version` | `flyway_schema_history` | *Global* | **REPLACE** | Alembic replaced with Flyway enterprise migration tracker. |

---

## Detailed Schema Specification for Target Tables

### 1. `surveys`
```sql
CREATE TABLE surveys (
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
CREATE INDEX idx_surveys_code ON surveys(survey_code);
CREATE INDEX idx_surveys_public_token ON surveys(public_token);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_study_id ON surveys(study_id);
```

### 2. `survey_versions`
```sql
CREATE TABLE survey_versions (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    definition_json TEXT NOT NULL DEFAULT '{}',
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_by_user_id BIGINT,
    CONSTRAINT uq_survey_versions_survey_version UNIQUE (survey_id, version_number)
);
CREATE INDEX idx_survey_versions_survey_id ON survey_versions(survey_id);
```

### 3. `survey_sections`
```sql
CREATE TABLE survey_sections (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_survey_sections_survey_id ON survey_sections(survey_id);
CREATE INDEX idx_survey_sections_position ON survey_sections(survey_id, position);
```

### 4. `questions`
```sql
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    section_id BIGINT REFERENCES survey_sections(id) ON DELETE SET NULL,
    position INT NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    options_json TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_questions_position ON questions(survey_id, position);
```

### 5. `question_options`
```sql
CREATE TABLE question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
```

### 6. `logic_rules`
```sql
CREATE TABLE logic_rules (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    if_question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    condition VARCHAR(30) NOT NULL DEFAULT 'is',
    value VARCHAR(255) NOT NULL,
    then_action VARCHAR(30) NOT NULL DEFAULT 'SHOW_QUESTION',
    then_question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE
);
CREATE INDEX idx_logic_rules_survey_id ON logic_rules(survey_id);
CREATE INDEX idx_logic_rules_if_question_id ON logic_rules(if_question_id);
```

### 7. `survey_assignments`
```sql
CREATE TABLE survey_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT uq_survey_assignments_user_survey UNIQUE (user_id, survey_id)
);
CREATE INDEX idx_survey_assignments_user_id ON survey_assignments(user_id);
CREATE INDEX idx_survey_assignments_survey_id ON survey_assignments(survey_id);
```

### 8. `responses`
```sql
CREATE TABLE responses (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    survey_version_id BIGINT REFERENCES survey_versions(id) ON DELETE SET NULL,
    study_id BIGINT,
    participant_id BIGINT,
    user_id BIGINT,
    submission_type VARCHAR(30) NOT NULL DEFAULT 'EXTERNAL',
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    session_token VARCHAR(128),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_responses_user_id ON responses(user_id);
CREATE INDEX idx_responses_session_token ON responses(session_token);
CREATE INDEX idx_responses_status ON responses(status);
```

### 9. `response_answers`
```sql
CREATE TABLE response_answers (
    id BIGSERIAL PRIMARY KEY,
    response_id BIGINT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value TEXT DEFAULT ''
);
CREATE INDEX idx_response_answers_response_id ON response_answers(response_id);
CREATE INDEX idx_response_answers_question_id ON response_answers(question_id);
```

### 10. `survey_audit_logs`
```sql
CREATE TABLE survey_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT REFERENCES surveys(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    actor_user_id BIGINT,
    correlation_id VARCHAR(64),
    ip_address VARCHAR(45),
    details_json TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_survey_audit_logs_survey_id ON survey_audit_logs(survey_id);
```
