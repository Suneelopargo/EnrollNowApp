package com.enrollnow.common.audit;

import java.util.UUID;

public interface AuditEntityDisplayResolver {

    boolean supports(String entityType);

    String resolve(
            UUID tenantId,
            UUID entityId
    );
}