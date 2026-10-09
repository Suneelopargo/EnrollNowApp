package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByTenantIdAndId(UUID tenantId, UUID id);

    List<User> findByTenantId(UUID tenantId);

    List<User> findByTenantIdAndStatus(UUID tenantId, String status);

    boolean existsByTenantIdAndId(UUID tenantId, UUID id);
}