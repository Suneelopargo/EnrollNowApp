package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.CreateSavedSearchRequest;
import com.enrollnow.participant.dtos.SavedSearchDto;
import com.enrollnow.participant.models.RegistrySavedSearch;
import com.enrollnow.participant.repositories.RegistrySavedSearchRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrySavedSearchServiceTest {

    @Mock
    private RegistrySavedSearchRepository repository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private RegistrySavedSearchService service;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new RegistrySavedSearchService(repository, objectMapper);
    }

    @Test
    void getSavedSearches_returnsMappedDtos() {
        RegistrySavedSearch s = new RegistrySavedSearch();
        s.setId(UUID.randomUUID());
        s.setTenantId(tenantId);
        s.setUserId(userId);
        s.setName("Pediatric Males");
        s.setSearchCriteria("{\"contactFilter\":\"yes\",\"availableFilter\":\"yes\",\"searchTerm\":\"pediatric\"}");

        when(repository.findByTenantIdAndUserIdOrderByNameAsc(tenantId, userId)).thenReturn(List.of(s));

        List<SavedSearchDto> result = service.getSavedSearches(tenantId, userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Pediatric Males");
        assertThat(result.get(0).getContactFilter()).isEqualTo("yes");
        assertThat(result.get(0).getAvailableFilter()).isEqualTo("yes");
    }

    @Test
    void createSavedSearch_serializesCriteriaAndSaves() {
        CreateSavedSearchRequest req = new CreateSavedSearchRequest();
        req.setName("Active Adults");
        req.setContactFilter("yes");
        req.setAvailableFilter("all");
        req.setSearchTerm("adult");

        when(repository.save(any(RegistrySavedSearch.class))).thenAnswer(invocation -> {
            RegistrySavedSearch entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        SavedSearchDto result = service.createSavedSearch(tenantId, userId, req);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Active Adults");
        assertThat(result.getContactFilter()).isEqualTo("yes");
        verify(repository).save(any(RegistrySavedSearch.class));
    }

    @Test
    void createSavedSearch_updatesExistingWhenNameMatches() {
        RegistrySavedSearch existing = new RegistrySavedSearch();
        existing.setId(UUID.randomUUID());
        existing.setName("Active Adults");
        existing.setTenantId(tenantId);
        existing.setUserId(userId);
        existing.setSearchCriteria("{}");

        when(repository.findByTenantIdAndUserIdAndName(tenantId, userId, "Active Adults"))
                .thenReturn(Optional.of(existing));
        when(repository.save(any(RegistrySavedSearch.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateSavedSearchRequest req = new CreateSavedSearchRequest();
        req.setName("Active Adults");
        req.setContactFilter("no");

        SavedSearchDto result = service.createSavedSearch(tenantId, userId, req);

        assertThat(result.getId()).isEqualTo(existing.getId().toString());
        assertThat(result.getContactFilter()).isEqualTo("no");
    }

    @Test
    void deleteSavedSearch_callsRepository() {
        UUID searchId = UUID.randomUUID();
        service.deleteSavedSearch(tenantId, userId, searchId);
        verify(repository).deleteByTenantIdAndUserIdAndId(tenantId, userId, searchId);
    }
}
