package com.enrollnow.common.audit;

/**
 * Represents one audited field/value change.
 *
 * Example:
 * fieldName = "studyPermission"
 * previousValue = "STUDY_RA"
 * newValue = "STUDY_ADMIN"
 */
public record AuditChange(
        String fieldName,
        Object previousValue,
        Object newValue
) {

    public AuditChange {
        if (fieldName == null || fieldName.isBlank()) {
            throw new IllegalArgumentException("fieldName must not be blank");
        }
    }
}