package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.GeneralSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GeneralSettingsRepository extends JpaRepository<GeneralSettings, UUID> {

    Optional<GeneralSettings> findByTenantId(UUID tenantId);

    boolean existsByTenantId(UUID tenantId);
}
