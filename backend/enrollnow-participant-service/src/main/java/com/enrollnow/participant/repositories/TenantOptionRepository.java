package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.TenantOption;
import com.enrollnow.participant.models.TenantOptionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantOptionRepository extends JpaRepository<TenantOption, UUID> {

    List<TenantOption> findByTenantIdAndCategoryAndActiveTrueOrderBySortOrderAscValueAsc(
            UUID tenantId,
            TenantOptionCategory category
    );
}
