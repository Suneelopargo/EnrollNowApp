package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.SavedRegistrySearch;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrySavedSearchRepository {
    List<SavedRegistrySearch> findByTenantIdAndOwnerUserId(UUID tenantId, UUID ownerUserId);
    Optional<SavedRegistrySearch> findByTenantIdAndOwnerUserIdAndId(UUID tenantId, UUID ownerUserId, UUID id);
    SavedRegistrySearch save(SavedRegistrySearch search);
    void delete(SavedRegistrySearch search);
}
