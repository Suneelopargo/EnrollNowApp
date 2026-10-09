package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserSecurityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSecurityStateRepository
        extends JpaRepository<UserSecurityState, UUID> {

    Optional<UserSecurityState> findByTenantIdAndUserId(
            UUID tenantId,
            UUID userId
    );
}