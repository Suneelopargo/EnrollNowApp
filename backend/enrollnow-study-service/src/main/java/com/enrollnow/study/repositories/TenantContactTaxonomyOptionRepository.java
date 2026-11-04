package com.enrollnow.study.repositories;

import com.enrollnow.study.models.TenantContactTaxonomyOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantContactTaxonomyOptionRepository extends JpaRepository<TenantContactTaxonomyOption, UUID> {

    List<TenantContactTaxonomyOption> findByTenantIdAndTaxonomyTypeAndActiveTrueOrderBySortOrderAscOptionValueAsc(
            UUID tenantId,
            String taxonomyType
    );

    List<TenantContactTaxonomyOption> findByTenantIdAndTaxonomyTypeOrderBySortOrderAscOptionValueAsc(
            UUID tenantId,
            String taxonomyType
    );

    Optional<TenantContactTaxonomyOption> findByTenantIdAndTaxonomyTypeAndId(
            UUID tenantId,
            String taxonomyType,
            UUID id
    );

    Optional<TenantContactTaxonomyOption> findByTenantIdAndTaxonomyTypeAndOptionValueIgnoreCase(
            UUID tenantId,
            String taxonomyType,
            String optionValue
    );

    boolean existsByTenantIdAndTaxonomyType(UUID tenantId, String taxonomyType);
}
