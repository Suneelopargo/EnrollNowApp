package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.SecuritySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecuritySettingsRepository
        extends JpaRepository<SecuritySettings, UUID> {

    Optional<SecuritySettings> findByTenantId(UUID tenantId);

    boolean existsByTenantId(UUID tenantId);
}