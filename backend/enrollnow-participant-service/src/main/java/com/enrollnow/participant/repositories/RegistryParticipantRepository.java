package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.RegistryParticipant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistryParticipantRepository {
    List<RegistryParticipant> findAllByTenantId(UUID tenantId);
    Optional<RegistryParticipant> findByTenantIdAndId(UUID tenantId, UUID id);
    Optional<RegistryParticipant> findByTenantIdAndGlobalId(UUID tenantId, String globalId);
    List<RegistryParticipant> findByTenantIdAndName(UUID tenantId, String firstName, String lastName);
    RegistryParticipant save(RegistryParticipant participant);
    void delete(RegistryParticipant participant);
}
