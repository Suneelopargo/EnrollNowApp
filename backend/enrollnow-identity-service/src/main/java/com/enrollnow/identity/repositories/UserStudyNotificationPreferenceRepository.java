package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.UserStudyNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserStudyNotificationPreferenceRepository extends JpaRepository<UserStudyNotificationPreference, UUID> {

    Optional<UserStudyNotificationPreference> findByTenantIdAndUserIdAndStudyId(UUID tenantId, UUID userId, UUID studyId);

    List<UserStudyNotificationPreference> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    void deleteByTenantIdAndUserId(UUID tenantId, UUID userId);
}
