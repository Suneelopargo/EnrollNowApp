package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantAddressRepository extends JpaRepository<ParticipantAddress, UUID> {

    List<ParticipantAddress> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    List<ParticipantAddress> findByTenantIdAndParticipantIdOrderByPrimaryAddressDescCreatedAtDesc(UUID tenantId, UUID participantId);

    Optional<ParticipantAddress> findByTenantIdAndParticipantIdAndId(UUID tenantId, UUID participantId, UUID id);

    List<ParticipantAddress> findByTenantIdAndParticipantIdIn(UUID tenantId, Collection<UUID> participantIds);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);

    @Query(value = """
        SELECT DISTINCT TRIM(a.city)
        FROM enrollnow.participant_addresses a
        JOIN enrollnow.participants p ON p.id = a.participant_id AND p.tenant_id = a.tenant_id
        WHERE a.tenant_id = :tenantId
          AND (p.status IS NULL OR UPPER(p.status) <> 'DELETED')
          AND a.city IS NOT NULL
          AND TRIM(a.city) <> ''
          AND (:siteId IS NULL OR p.site_id = :siteId)
        ORDER BY TRIM(a.city)
        """, nativeQuery = true)
    List<String> findDistinctCitiesByTenantAndSite(
            @Param("tenantId") UUID tenantId,
            @Param("siteId") UUID siteId
    );

    @Query(value = """
        SELECT DISTINCT TRIM(a.state_region)
        FROM enrollnow.participant_addresses a
        JOIN enrollnow.participants p ON p.id = a.participant_id AND p.tenant_id = a.tenant_id
        WHERE a.tenant_id = :tenantId
          AND (p.status IS NULL OR UPPER(p.status) <> 'DELETED')
          AND a.state_region IS NOT NULL
          AND TRIM(a.state_region) <> ''
          AND (:siteId IS NULL OR p.site_id = :siteId)
        ORDER BY TRIM(a.state_region)
        """, nativeQuery = true)
    List<String> findDistinctStatesByTenantAndSite(
            @Param("tenantId") UUID tenantId,
            @Param("siteId") UUID siteId
    );

    @Query(value = """
        SELECT DISTINCT TRIM(a.postal_code)
        FROM enrollnow.participant_addresses a
        JOIN enrollnow.participants p ON p.id = a.participant_id AND p.tenant_id = a.tenant_id
        WHERE a.tenant_id = :tenantId
          AND (p.status IS NULL OR UPPER(p.status) <> 'DELETED')
          AND a.postal_code IS NOT NULL
          AND TRIM(a.postal_code) <> ''
          AND (:siteId IS NULL OR p.site_id = :siteId)
        ORDER BY TRIM(a.postal_code)
        """, nativeQuery = true)
    List<String> findDistinctZipcodesByTenantAndSite(
            @Param("tenantId") UUID tenantId,
            @Param("siteId") UUID siteId
    );
}
