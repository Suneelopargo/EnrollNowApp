package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.RegistrySavedSearch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegistrySavedSearchRepository extends JpaRepository<RegistrySavedSearch, UUID> {

    List<RegistrySavedSearch> findByTenantIdAndUserIdOrderByNameAsc(UUID tenantId, UUID userId);

    Optional<RegistrySavedSearch> findByTenantIdAndUserIdAndName(UUID tenantId, UUID userId, String name);

    Optional<RegistrySavedSearch> findByTenantIdAndUserIdAndId(UUID tenantId, UUID userId, UUID id);

    void deleteByTenantIdAndUserIdAndId(UUID tenantId, UUID userId, UUID id);
}
