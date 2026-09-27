-- V4__audit_foundation.sql
-- Audit Ledger for Security, Identity, and Administrative Events

CREATE TABLE admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    performed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    performed_by_username VARCHAR(100),
    target_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    target_username VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    location_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_performed_by ON admin_audit_logs(performed_by);
CREATE INDEX idx_admin_audit_logs_target_user_id ON admin_audit_logs(target_user_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_admin_audit_logs_action_created ON admin_audit_logs(action, created_at);
