package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.SurveyDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SurveyDefinitionRepository extends JpaRepository<SurveyDefinition, UUID> {
    List<SurveyDefinition> findByTenantIdAndActiveTrue(UUID tenantId);
    Optional<SurveyDefinition> findByTenantIdAndId(UUID tenantId, UUID id);
}
