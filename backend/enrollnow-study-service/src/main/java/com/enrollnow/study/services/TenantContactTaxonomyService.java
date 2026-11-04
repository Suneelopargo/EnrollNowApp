package com.enrollnow.study.services;

import com.enrollnow.study.dtos.ContactTaxonomyDto;
import com.enrollnow.study.models.TenantContactTaxonomyOption;
import com.enrollnow.study.repositories.TenantContactTaxonomyOptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TenantContactTaxonomyService {

    public static final String RELATIONSHIP = "RELATIONSHIP";
    public static final String OUTCOME = "OUTCOME";

    private final TenantContactTaxonomyOptionRepository repository;

    public TenantContactTaxonomyService(TenantContactTaxonomyOptionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public List<TenantContactTaxonomyOption> getOptions(UUID tenantId, String taxonomyType) {
        validateType(taxonomyType);
        return repository.findByTenantIdAndTaxonomyTypeAndActiveTrueOrderBySortOrderAscOptionValueAsc(
                tenantId,
                taxonomyType
        );
    }

    @Transactional
    public void replaceOptions(UUID tenantId, String taxonomyType, List<ContactTaxonomyDto> requestedOptions) {
        validateType(taxonomyType);
        List<TenantContactTaxonomyOption> existing =
                repository.findByTenantIdAndTaxonomyTypeOrderBySortOrderAscOptionValueAsc(tenantId, taxonomyType);
        Map<UUID, TenantContactTaxonomyOption> byId = new HashMap<>();
        for (TenantContactTaxonomyOption option : existing) {
            byId.put(option.getId(), option);
        }

        Set<String> normalizedValues = new HashSet<>();
        List<ContactTaxonomyDto> options = requestedOptions != null ? requestedOptions : List.of();
        for (ContactTaxonomyDto dto : options) {
            if (dto == null || dto.getValue() == null || dto.getValue().isBlank()) continue;
            String value = dto.getValue().trim();
            if (!normalizedValues.add(value.toLowerCase(Locale.ROOT))) {
                throw new IllegalArgumentException("Duplicate " + taxonomyType.toLowerCase(Locale.ROOT) + " option: " + value);
            }
        }

        Set<UUID> retainedIds = new HashSet<>();
        int sortOrder = 0;
        for (ContactTaxonomyDto dto : options) {
            if (dto == null || dto.getValue() == null || dto.getValue().isBlank()) continue;
            String value = dto.getValue().trim();

            TenantContactTaxonomyOption option = findExisting(dto.getId(), value, tenantId, taxonomyType, byId);
            if (option == null) {
                option = new TenantContactTaxonomyOption(tenantId, taxonomyType, value, sortOrder);
            } else {
                option.setOptionValue(value);
                option.setSortOrder(sortOrder);
                option.setActive(true);
                retainedIds.add(option.getId());
            }
            sortOrder++;
            repository.save(option);
            if (option.getId() != null) retainedIds.add(option.getId());
        }

        for (TenantContactTaxonomyOption option : existing) {
            if (option.isActive() && !retainedIds.contains(option.getId())) {
                option.setActive(false);
                repository.save(option);
            }
        }
    }

    @Transactional
    public void recordOption(UUID tenantId, String taxonomyType, String value) {
        validateType(taxonomyType);
        if (value == null || value.isBlank()) return;

        String normalizedValue = value.trim();
        Optional<TenantContactTaxonomyOption> existing =
                repository.findByTenantIdAndTaxonomyTypeAndOptionValueIgnoreCase(
                        tenantId,
                        taxonomyType,
                        normalizedValue
                );
        if (existing.isPresent()) {
            TenantContactTaxonomyOption option = existing.get();
            if (!option.isActive()) {
                option.setActive(true);
                repository.save(option);
            }
            return;
        }

        int sortOrder = repository.findByTenantIdAndTaxonomyTypeOrderBySortOrderAscOptionValueAsc(
                tenantId,
                taxonomyType
        ).size();
        repository.save(new TenantContactTaxonomyOption(tenantId, taxonomyType, normalizedValue, sortOrder));
    }

    private TenantContactTaxonomyOption findExisting(
            String id,
            String value,
            UUID tenantId,
            String taxonomyType,
            Map<UUID, TenantContactTaxonomyOption> byId
    ) {
        if (id != null && !id.isBlank()) {
            try {
                UUID parsedId = UUID.fromString(id);
                TenantContactTaxonomyOption option = byId.get(parsedId);
                if (option != null) return option;
            } catch (IllegalArgumentException ignored) {
                // Legacy taxonomy IDs are not UUIDs; match those options by their existing value.
            }
        }
        return repository.findByTenantIdAndTaxonomyTypeAndOptionValueIgnoreCase(
                tenantId,
                taxonomyType,
                value
        ).orElse(null);
    }

    private void validateType(String taxonomyType) {
        if (!RELATIONSHIP.equals(taxonomyType) && !OUTCOME.equals(taxonomyType)) {
            throw new IllegalArgumentException("Unsupported contact taxonomy type: " + taxonomyType);
        }
    }
}
