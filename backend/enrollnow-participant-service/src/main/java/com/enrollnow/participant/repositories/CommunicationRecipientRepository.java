package com.enrollnow.participant.repositories;

import com.enrollnow.participant.models.CommunicationRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommunicationRecipientRepository extends JpaRepository<CommunicationRecipient, UUID> {
    List<CommunicationRecipient> findByTenantIdAndCommunicationId(UUID tenantId, UUID communicationId);
    List<CommunicationRecipient> findByTenantIdAndParticipantId(UUID tenantId, UUID participantId);
}
