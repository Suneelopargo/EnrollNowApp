package com.enrollnow.common.audit;

/**
 * Cross-module audit contract.
 *
 * Business modules depend only on this interface.
 * The persistence implementation will be provided by the audit module.
 *
 * Audit writes should participate in the caller's transaction so that
 * successful business changes and their audit records commit together.
 */
public interface AuditRecorder {

    void record(AuditEventCommand command);
}