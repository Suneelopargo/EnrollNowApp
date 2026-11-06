package com.enrollnow.study.services;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.enrollnow.common.audit.AuditEntityDisplayResolver;
import com.enrollnow.study.repositories.StudyRepository;

@Component
public class StudyAuditEntityDisplayResolver
        implements AuditEntityDisplayResolver {

    private final StudyRepository studyRepository;

    public StudyAuditEntityDisplayResolver(
            StudyRepository studyRepository
    ) {
        this.studyRepository = studyRepository;
    }

    @Override
    public boolean supports(String entityType) {
        return "STUDY".equalsIgnoreCase(entityType);
    }

    @Override
    public String resolve(
            UUID tenantId,
            UUID entityId
    ) {
        if (entityId == null) {
            return null;
        }

        return studyRepository
                .findByTenantIdAndId(tenantId, entityId)
                .map(study -> study.getName())
                .orElse(null);
    }
}