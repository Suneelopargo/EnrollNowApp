package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository
        extends JpaRepository<UserSession, UUID> {

    List<UserSession> findByTenantIdAndUserId(
            UUID tenantId,
            UUID userId
    );

    List<UserSession> findByTenantIdAndUserIdAndRevokedAtIsNull(
            UUID tenantId,
            UUID userId
    );

    Optional<UserSession> findBySessionTokenHash(
            String sessionTokenHash
    );
}