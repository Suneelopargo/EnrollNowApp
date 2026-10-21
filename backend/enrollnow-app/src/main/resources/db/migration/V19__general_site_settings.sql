-- EnrollNow
-- V19: General Site Settings and Security Settings Defaults
--
-- Purpose:
-- Creates enrollnow.general_settings table for tenant/site-wide configuration
-- (such as automated SMS text reply template) and ensures default settings exist.

SET search_path TO enrollnow, public;

-- ============================================================
-- 1. GENERAL SITE SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS general_settings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL,
    default_text_reply   VARCHAR(160) NOT NULL DEFAULT 'This is an automated message. We can not receive replies to this number.',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by           UUID,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by           UUID,
    CONSTRAINT fk_general_settings_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_general_settings_tenant
        UNIQUE (tenant_id)
);

-- Seed general settings for existing tenants
INSERT INTO general_settings (tenant_id, default_text_reply)
SELECT id, 'This is an automated message. We can not receive replies to this number.'
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Seed default security settings for existing tenants if not present
INSERT INTO security_settings (
    tenant_id,
    max_failed_login_attempts,
    prevent_concurrent_sessions,
    inactivity_logout_minutes,
    inactivity_lock_days,
    password_expiry_days,
    password_history_count,
    minimum_password_length,
    minimum_password_strength,
    require_digit,
    require_symbol,
    require_mixed_case
)
SELECT
    id,
    10,
    FALSE,
    30,
    90,
    300,
    4,
    10,
    'MODERATE',
    TRUE,
    TRUE,
    TRUE
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;
