package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserPasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserPasswordHistoryRepository
        extends JpaRepository<UserPasswordHistory, UUID> {

    List<UserPasswordHistory>
    findByTenantIdAndUserIdOrderByCreatedAtDesc(
            UUID tenantId,
            UUID userId
    );
}