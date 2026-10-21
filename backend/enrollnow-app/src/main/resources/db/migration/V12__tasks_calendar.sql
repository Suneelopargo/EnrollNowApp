-- EnrollNow
-- V12: Tasks & Calendar
--
-- Supports:
--   operational tasks
--   task assignment
--   task status history
--   calendar events
--   calendar event attendees
--
-- Tasks and Calendar are related operational concepts but are
-- intentionally modeled separately.
--
-- All tenant-owned relationships use tenant-safe composite FKs.

SET search_path TO enrollnow, public;


-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE tasks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID,
    participant_id          UUID,
    candidate_id            UUID,
    enrollment_id           UUID,

    title                   VARCHAR(255) NOT NULL,
    description             TEXT,

    task_type               VARCHAR(50),

    priority                VARCHAR(20) NOT NULL DEFAULT 'NORMAL',

    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN',

    due_at                  TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,

    created_by_user_id      UUID,
    completed_by_user_id    UUID,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_tasks_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_tasks_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_tasks_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_tasks_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id),

    CONSTRAINT fk_tasks_enrollment_tenant
        FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES study_enrollments(tenant_id, id),

    CONSTRAINT fk_tasks_created_by_user_tenant
        FOREIGN KEY (tenant_id, created_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT fk_tasks_completed_by_user_tenant
        FOREIGN KEY (tenant_id, completed_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_tasks_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_tasks_priority
        CHECK (
            priority IN (
                'LOW',
                'NORMAL',
                'HIGH',
                'URGENT'
            )
        ),

    CONSTRAINT ck_tasks_status
        CHECK (
            status IN (
                'OPEN',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT ck_tasks_dates
        CHECK (
            (completed_at IS NULL OR completed_at >= created_at)
            AND
            (cancelled_at IS NULL OR cancelled_at >= created_at)
        )
);


CREATE INDEX ix_tasks_study_status
    ON tasks (
        tenant_id,
        study_id,
        status
    );


CREATE INDEX ix_tasks_participant
    ON tasks (
        tenant_id,
        participant_id
    );


CREATE INDEX ix_tasks_due
    ON tasks (
        tenant_id,
        due_at
    );


CREATE INDEX ix_tasks_status
    ON tasks (
        tenant_id,
        status
    );


-- ============================================================
-- TASK ASSIGNMENTS
--
-- Allows one task to be assigned to one or more users.
-- ============================================================

CREATE TABLE task_assignments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    task_id                 UUID NOT NULL,
    user_id                 UUID NOT NULL,

    assignment_role         VARCHAR(30) NOT NULL DEFAULT 'ASSIGNEE',

    assigned_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by_user_id     UUID,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_task_assignments_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_task_assignments_task_tenant
        FOREIGN KEY (tenant_id, task_id)
        REFERENCES tasks(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_assignments_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT fk_task_assignments_assigned_by_tenant
        FOREIGN KEY (tenant_id, assigned_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_task_assignments_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_task_assignments_active_user
        UNIQUE (
            tenant_id,
            task_id,
            user_id
        ),

    CONSTRAINT ck_task_assignments_role
        CHECK (
            assignment_role IN (
                'ASSIGNEE',
                'OWNER',
                'WATCHER'
            )
        )
);


CREATE INDEX ix_task_assignments_user
    ON task_assignments (
        tenant_id,
        user_id,
        active
    );


CREATE INDEX ix_task_assignments_task
    ON task_assignments (
        tenant_id,
        task_id
    );


-- ============================================================
-- TASK STATUS HISTORY
--
-- Append-only task lifecycle history.
-- ============================================================

CREATE TABLE task_status_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    task_id                 UUID NOT NULL,

    previous_status         VARCHAR(30),
    new_status              VARCHAR(30) NOT NULL,

    reason                  VARCHAR(500),

    changed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by              UUID,

    CONSTRAINT fk_task_status_history_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_task_status_history_task_tenant
        FOREIGN KEY (tenant_id, task_id)
        REFERENCES tasks(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT uk_task_status_history_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_task_status_history_previous
        CHECK (
            previous_status IS NULL
            OR previous_status IN (
                'OPEN',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT ck_task_status_history_new
        CHECK (
            new_status IN (
                'OPEN',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        )
);


CREATE INDEX ix_task_status_history_task
    ON task_status_history (
        tenant_id,
        task_id,
        changed_at DESC
    );


-- ============================================================
-- CALENDAR EVENTS
--
-- Calendar events may be:
--
-- meetings
-- participant appointments
-- study visits
-- recruitment calls
-- internal study events
--
-- Recurrence rules can be added later if required.
-- ============================================================

CREATE TABLE calendar_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    study_id                UUID,
    participant_id          UUID,
    candidate_id            UUID,
    enrollment_id           UUID,

    title                   VARCHAR(255) NOT NULL,
    description             TEXT,

    event_type              VARCHAR(50),

    location                VARCHAR(500),

    start_at                TIMESTAMPTZ NOT NULL,
    end_at                  TIMESTAMPTZ NOT NULL,

    all_day                 BOOLEAN NOT NULL DEFAULT FALSE,

    status                  VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',

    created_by_user_id      UUID,

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,

    CONSTRAINT fk_calendar_events_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_calendar_events_study_tenant
        FOREIGN KEY (tenant_id, study_id)
        REFERENCES studies(tenant_id, id),

    CONSTRAINT fk_calendar_events_participant_tenant
        FOREIGN KEY (tenant_id, participant_id)
        REFERENCES participants(tenant_id, id),

    CONSTRAINT fk_calendar_events_candidate_tenant
        FOREIGN KEY (tenant_id, candidate_id)
        REFERENCES study_candidates(tenant_id, id),

    CONSTRAINT fk_calendar_events_enrollment_tenant
        FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES study_enrollments(tenant_id, id),

    CONSTRAINT fk_calendar_events_user_tenant
        FOREIGN KEY (tenant_id, created_by_user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_calendar_events_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT ck_calendar_events_status
        CHECK (
            status IN (
                'SCHEDULED',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT ck_calendar_events_dates
        CHECK (
            end_at >= start_at
        )
);


CREATE INDEX ix_calendar_events_study_time
    ON calendar_events (
        tenant_id,
        study_id,
        start_at
    );


CREATE INDEX ix_calendar_events_participant_time
    ON calendar_events (
        tenant_id,
        participant_id,
        start_at
    );


CREATE INDEX ix_calendar_events_time
    ON calendar_events (
        tenant_id,
        start_at,
        end_at
    );


-- ============================================================
-- CALENDAR EVENT ATTENDEES
--
-- Supports internal EnrollNow users as attendees.
--
-- External participant/contact attendees can be added later
-- through communication/contact models if required.
-- ============================================================

CREATE TABLE calendar_event_attendees (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,

    calendar_event_id       UUID NOT NULL,
    user_id                 UUID NOT NULL,

    attendee_role           VARCHAR(30) NOT NULL DEFAULT 'ATTENDEE',

    response_status         VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    active                  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_calendar_event_attendees_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    CONSTRAINT fk_calendar_event_attendees_event_tenant
        FOREIGN KEY (tenant_id, calendar_event_id)
        REFERENCES calendar_events(tenant_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_calendar_event_attendees_user_tenant
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES users(tenant_id, id),

    CONSTRAINT uk_calendar_event_attendees_tenant_id
        UNIQUE (tenant_id, id),

    CONSTRAINT uk_calendar_event_attendees_event_user
        UNIQUE (
            tenant_id,
            calendar_event_id,
            user_id
        ),

    CONSTRAINT ck_calendar_event_attendees_role
        CHECK (
            attendee_role IN (
                'ORGANIZER',
                'ATTENDEE'
            )
        ),

    CONSTRAINT ck_calendar_event_attendees_response
        CHECK (
            response_status IN (
                'PENDING',
                'ACCEPTED',
                'DECLINED',
                'TENTATIVE'
            )
        )
);


CREATE INDEX ix_calendar_event_attendees_user
    ON calendar_event_attendees (
        tenant_id,
        user_id,
        active
    );