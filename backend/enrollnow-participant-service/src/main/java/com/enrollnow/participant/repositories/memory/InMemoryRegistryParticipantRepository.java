package com.enrollnow.participant.repositories.memory;

import com.enrollnow.participant.models.RegistryParticipant;
import com.enrollnow.participant.repositories.RegistryParticipantRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class InMemoryRegistryParticipantRepository implements RegistryParticipantRepository {
    private final ConcurrentMap<UUID, RegistryParticipant> store = new ConcurrentHashMap<>();

    @PostConstruct
    public void seed() {
        if (!store.isEmpty()) return;
        UUID tenant = InMemoryRegistryData.DEFAULT_TENANT;
        store.putAll(InMemoryRegistryData.sampleParticipants(tenant));
    }

    @Override
    public List<RegistryParticipant> findAllByTenantId(UUID tenantId) {
        return store.values().stream()
                .filter(p -> tenantId.equals(p.getTenantId()) && !p.isDeleted())
                .sorted(Comparator.comparing(RegistryParticipant::getLastName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    @Override
    public Optional<RegistryParticipant> findByTenantIdAndId(UUID tenantId, UUID id) {
        return Optional.ofNullable(store.get(id))
                .filter(p -> tenantId.equals(p.getTenantId()) && !p.isDeleted());
    }

    @Override
    public Optional<RegistryParticipant> findByTenantIdAndGlobalId(UUID tenantId, String globalId) {
        if (globalId == null) return Optional.empty();
        return store.values().stream()
                .filter(p -> tenantId.equals(p.getTenantId()) && !p.isDeleted())
                .filter(p -> globalId.equalsIgnoreCase(p.getGlobalId()))
                .findFirst();
    }

    @Override
    public List<RegistryParticipant> findByTenantIdAndName(UUID tenantId, String firstName, String lastName) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();
        return store.values().stream()
                .filter(p -> tenantId.equals(p.getTenantId()) && !p.isDeleted())
                .filter(p -> p.getFirstName() != null && p.getLastName() != null)
                .filter(p -> p.getFirstName().equalsIgnoreCase(first) && p.getLastName().equalsIgnoreCase(last))
                .toList();
    }

    @Override
    public RegistryParticipant save(RegistryParticipant participant) {
        if (participant.getId() == null) participant.setId(UUID.randomUUID());
        store.put(participant.getId(), participant);
        return participant;
    }

    @Override
    public void delete(RegistryParticipant participant) {
        participant.setDeleted(true);
        store.put(participant.getId(), participant);
    }
}
