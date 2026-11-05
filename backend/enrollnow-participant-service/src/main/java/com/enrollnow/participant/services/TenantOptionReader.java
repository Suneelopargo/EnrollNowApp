package com.enrollnow.participant.services;

import com.enrollnow.participant.models.TenantOptionCategory;
import com.enrollnow.participant.repositories.TenantOptionRepository;

import java.util.List;
import java.util.UUID;

final class TenantOptionReader {

    private TenantOptionReader() {
    }

    static List<String> read(
            TenantOptionRepository repository,
            UUID tenantId,
            TenantOptionCategory category
    ) {
        if (repository == null || tenantId == null) {
            return List.of();
        }

        return repository.findByTenantIdAndCategoryAndActiveTrueOrderBySortOrderAscValueAsc(tenantId, category)
                .stream()
                .map(option -> option.getValue().trim())
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
