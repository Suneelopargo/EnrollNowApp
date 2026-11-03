package com.enrollnow.identity.services;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.enrollnow.common.audit.AuditEntityDisplayResolver;
import com.enrollnow.identity.repositories.UserRepository;

@Component
public class UserAuditEntityDisplayResolver
        implements AuditEntityDisplayResolver {

    private final UserRepository userRepository;

    public UserAuditEntityDisplayResolver(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean supports(String entityType) {
        return "USER".equalsIgnoreCase(entityType);
    }

    @Override
    public String resolve(
            UUID tenantId,
            UUID entityId
    ) {
        if (entityId == null) {
            return null;
        }

        return userRepository
                .findByTenantIdAndId(tenantId, entityId)
                .map(user -> (
                        user.getFirstName()
                        + " "
                        + user.getLastName()
                ).trim())
                .orElse(null);
    }
}