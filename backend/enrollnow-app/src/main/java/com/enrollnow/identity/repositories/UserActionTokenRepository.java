package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserActionToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserActionTokenRepository
        extends JpaRepository<UserActionToken, UUID> {

    Optional<UserActionToken> findByTokenHash(String tokenHash);

    List<UserActionToken> findByTenantIdAndUserIdAndTokenType(
            UUID tenantId,
            UUID userId,
            String tokenType
    );

    List<UserActionToken> findByTenantIdAndUserIdAndTokenTypeAndUsedAtIsNull(
            UUID tenantId,
            UUID userId,
            String tokenType
    );
}