package com.enrollnow.common.audit;

import java.util.UUID;

public interface AuditEventDescriptionResolver {

    String resolveDescription(UUID tenantId, String description);
}
