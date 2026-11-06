package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserLoginActivity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserLoginActivityRepository extends JpaRepository<UserLoginActivity, UUID> {

    List<UserLoginActivity> findTop5ByTenantIdAndUserIdOrderByLoginAtDesc(UUID tenantId, UUID userId);

    List<UserLoginActivity> findByTenantIdAndUserIdOrderByLoginAtDesc(UUID tenantId, UUID userId, Pageable pageable);

    void deleteByTenantIdAndUserId(UUID tenantId, UUID userId);
}
