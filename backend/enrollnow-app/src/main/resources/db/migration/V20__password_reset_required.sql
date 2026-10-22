-- EnrollNow
-- V20: Mandatory Password Reset Enforcement
--
-- Adds dedicated password_reset_required flag to user_security_state
-- to support administrative force reset workflows without conflating
-- password resets with unrelated account locks.

SET search_path TO enrollnow, public;

ALTER TABLE user_security_state
    ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS ix_user_security_reset_required
    ON user_security_state (tenant_id, password_reset_required)
    WHERE password_reset_required = TRUE;
