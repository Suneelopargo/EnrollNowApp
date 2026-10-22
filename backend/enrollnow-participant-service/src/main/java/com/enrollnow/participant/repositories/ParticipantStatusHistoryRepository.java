package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.ParticipantStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ParticipantStatusHistoryRepository extends JpaRepository<ParticipantStatusHistory, UUID> {

    List<ParticipantStatusHistory> findByTenantIdAndParticipantIdOrderByChangedAtDesc(UUID tenantId, UUID participantId);

    void deleteByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
