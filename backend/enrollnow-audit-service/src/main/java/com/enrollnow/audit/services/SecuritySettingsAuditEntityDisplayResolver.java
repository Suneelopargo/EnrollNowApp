package com.enrollnow.audit.services;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.enrollnow.common.audit.AuditEntityDisplayResolver;

@Component
public class SecuritySettingsAuditEntityDisplayResolver
        implements AuditEntityDisplayResolver {

    @Override
    public boolean supports(String entityType) {
        return "SECURITY_SETTINGS".equalsIgnoreCase(entityType);
    }

    @Override
    public String resolve(
            UUID tenantId,
            UUID entityId
    ) {
        return "Security Settings";
    }
}