package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserEmailRepository extends JpaRepository<UserEmail, UUID> {

    Optional<UserEmail> findByTenantIdAndEmailIgnoreCase(
            UUID tenantId,
            String email
    );

    Optional<UserEmail> findByTenantIdAndUserIdAndPrimaryEmailTrue(
            UUID tenantId,
            UUID userId
    );

    List<UserEmail> findByTenantIdAndUserId(
            UUID tenantId,
            UUID userId
    );

    boolean existsByTenantIdAndEmailIgnoreCase(
            UUID tenantId,
            String email
    );
}