package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.Participant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, UUID>, JpaSpecificationExecutor<Participant> {

    Optional<Participant> findByTenantIdAndId(UUID tenantId, UUID id);

    List<Participant> findByTenantId(UUID tenantId);

    List<Participant> findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCase(UUID tenantId, String firstName, String lastName);

    List<Participant> findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCaseAndStatusNot(
            UUID tenantId, String firstName, String lastName, String status
    );

    Page<Participant> findByTenantId(UUID tenantId, Pageable pageable);

    long countByTenantId(UUID tenantId);

    @Query(value = """
        SELECT t.tag
        FROM (
            SELECT jsonb_array_elements_text(p.custom_attributes->'tags') AS tag
            FROM enrollnow.participants p
            WHERE p.tenant_id = :tenantId
              AND (p.status IS NULL OR p.status <> 'DELETED')
              AND p.custom_attributes IS NOT NULL
              AND jsonb_typeof(p.custom_attributes->'tags') = 'array'
              AND (:siteId IS NULL OR p.site_id = :siteId)
        ) t
        WHERE (:search IS NULL OR :search = '' OR t.tag ILIKE CONCAT('%', :search, '%'))
          AND TRIM(t.tag) <> ''
        GROUP BY t.tag
        ORDER BY COUNT(*) DESC, t.tag ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<String> findDistinctTagsByTenantAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("siteId") UUID siteId,
            @Param("search") String search,
            @Param("limit") int limit
    );
}
