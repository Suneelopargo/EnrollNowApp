package com.enrollnow.participant.repositories.memory;

import com.enrollnow.participant.models.SavedRegistrySearch;
import com.enrollnow.participant.repositories.RegistrySavedSearchRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class InMemoryRegistrySavedSearchRepository implements RegistrySavedSearchRepository {
    private final ConcurrentMap<UUID, SavedRegistrySearch> store = new ConcurrentHashMap<>();

    @Override
    public List<SavedRegistrySearch> findByTenantIdAndOwnerUserId(UUID tenantId, UUID ownerUserId) {
        return store.values().stream()
                .filter(s -> tenantId.equals(s.getTenantId()) && ownerUserId.equals(s.getOwnerUserId()))
                .sorted(Comparator.comparing(SavedRegistrySearch::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Override
    public Optional<SavedRegistrySearch> findByTenantIdAndOwnerUserIdAndId(UUID tenantId, UUID ownerUserId, UUID id) {
        return Optional.ofNullable(store.get(id))
                .filter(s -> tenantId.equals(s.getTenantId()) && ownerUserId.equals(s.getOwnerUserId()));
    }

    @Override
    public SavedRegistrySearch save(SavedRegistrySearch search) {
        if (search.getId() == null) search.setId(UUID.randomUUID());
        store.put(search.getId(), search);
        return search;
    }

    @Override
    public void delete(SavedRegistrySearch search) {
        store.remove(search.getId());
    }
}
