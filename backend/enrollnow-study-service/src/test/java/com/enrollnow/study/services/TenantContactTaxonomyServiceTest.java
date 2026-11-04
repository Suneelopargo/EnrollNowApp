package com.enrollnow.study.services;

import com.enrollnow.study.dtos.ContactTaxonomyDto;
import com.enrollnow.study.models.TenantContactTaxonomyOption;
import com.enrollnow.study.repositories.TenantContactTaxonomyOptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantContactTaxonomyServiceTest {

    @Mock
    private TenantContactTaxonomyOptionRepository repository;

    private TenantContactTaxonomyService service;
    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        service = new TenantContactTaxonomyService(repository);
    }

    @Test
    void getOptionsReturnsNoOptionsForUninitializedTenant() {
        when(repository.findByTenantIdAndTaxonomyTypeAndActiveTrueOrderBySortOrderAscOptionValueAsc(
                tenantId, TenantContactTaxonomyService.RELATIONSHIP
        )).thenReturn(List.of());

        List<TenantContactTaxonomyOption> options =
                service.getOptions(tenantId, TenantContactTaxonomyService.RELATIONSHIP);

        assertThat(options).isEmpty();
    }

    @Test
    void replaceOptionsRenamesAddsAndDeactivatesTenantOptions() {
        UUID renameId = UUID.randomUUID();
        UUID deleteId = UUID.randomUUID();
        TenantContactTaxonomyOption rename = new TenantContactTaxonomyOption(
                tenantId, TenantContactTaxonomyService.OUTCOME, "Old Outcome", 0
        );
        rename.setId(renameId);
        TenantContactTaxonomyOption delete = new TenantContactTaxonomyOption(
                tenantId, TenantContactTaxonomyService.OUTCOME, "Removed Outcome", 1
        );
        delete.setId(deleteId);
        when(repository.findByTenantIdAndTaxonomyTypeOrderBySortOrderAscOptionValueAsc(
                tenantId, TenantContactTaxonomyService.OUTCOME
        )).thenReturn(List.of(rename, delete));

        service.replaceOptions(
                tenantId,
                TenantContactTaxonomyService.OUTCOME,
                List.of(new ContactTaxonomyDto(renameId.toString(), "Renamed Outcome"),
                        new ContactTaxonomyDto(null, "New Outcome"))
        );

        assertThat(rename.getOptionValue()).isEqualTo("Renamed Outcome");
        assertThat(rename.getSortOrder()).isZero();
        assertThat(rename.isActive()).isTrue();
        assertThat(delete.isActive()).isFalse();
        verify(repository, times(3)).save(any(TenantContactTaxonomyOption.class));
    }

    @Test
    void replaceOptionsRejectsDuplicateNamesIgnoringCase() {
        when(repository.findByTenantIdAndTaxonomyTypeOrderBySortOrderAscOptionValueAsc(
                tenantId, TenantContactTaxonomyService.RELATIONSHIP
        )).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class, () -> service.replaceOptions(
                tenantId,
                TenantContactTaxonomyService.RELATIONSHIP,
                List.of(new ContactTaxonomyDto(null, "Caregiver"),
                        new ContactTaxonomyDto(null, "caregiver"))
        ));
        verify(repository, never()).save(any(TenantContactTaxonomyOption.class));
    }

    @Test
    void recordOptionAddsNewValueWithoutSeedingDefaults() {
        when(repository.findByTenantIdAndTaxonomyTypeAndOptionValueIgnoreCase(
                tenantId, TenantContactTaxonomyService.OUTCOME, "Custom Outcome"
        )).thenReturn(Optional.empty());
        when(repository.findByTenantIdAndTaxonomyTypeOrderBySortOrderAscOptionValueAsc(
                tenantId, TenantContactTaxonomyService.OUTCOME
        )).thenReturn(List.of());

        service.recordOption(tenantId, TenantContactTaxonomyService.OUTCOME, " Custom Outcome ");

        ArgumentCaptor<TenantContactTaxonomyOption> customCaptor =
                ArgumentCaptor.forClass(TenantContactTaxonomyOption.class);
        verify(repository).save(customCaptor.capture());
        assertThat(customCaptor.getValue().getOptionValue()).isEqualTo("Custom Outcome");
        assertThat(customCaptor.getValue().getSortOrder()).isZero();
        verify(repository, never()).saveAll(any());
    }
}
