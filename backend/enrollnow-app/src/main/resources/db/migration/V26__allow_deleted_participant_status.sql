-- EnrollNow
-- V26: Allow DELETED status in participants and participant_status_history
--
-- Enables soft deletion of participants while maintaining audit history and referential integrity.

SET search_path TO enrollnow, public;

ALTER TABLE participants
    DROP CONSTRAINT IF EXISTS ck_participants_status;

ALTER TABLE participants
    ADD CONSTRAINT ck_participants_status
    CHECK (
        status IN (
            'ACTIVE',
            'INACTIVE',
            'DECEASED',
            'MERGED',
            'DELETED'
        )
    );

ALTER TABLE participant_status_history
    DROP CONSTRAINT IF EXISTS ck_participant_status_history_previous;

ALTER TABLE participant_status_history
    ADD CONSTRAINT ck_participant_status_history_previous
    CHECK (
        previous_status IS NULL
        OR previous_status IN (
            'ACTIVE',
            'INACTIVE',
            'DECEASED',
            'MERGED',
            'DELETED'
        )
    );

ALTER TABLE participant_status_history
    DROP CONSTRAINT IF EXISTS ck_participant_status_history_new;

ALTER TABLE participant_status_history
    ADD CONSTRAINT ck_participant_status_history_new
    CHECK (
        new_status IN (
            'ACTIVE',
            'INACTIVE',
            'DECEASED',
            'MERGED',
            'DELETED'
        )
    );
