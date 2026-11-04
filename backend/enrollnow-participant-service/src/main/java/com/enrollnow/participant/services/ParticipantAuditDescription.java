package com.enrollnow.participant.services;

import com.enrollnow.participant.models.Participant;
import com.enrollnow.participant.repositories.ParticipantRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

final class ParticipantAuditDescription {

    private ParticipantAuditDescription() {
    }

    static String participantDisplayName(
            ParticipantRepository participantRepository,
            UUID tenantId,
            UUID participantId) {
        return participantRepository.findByTenantIdAndId(tenantId, participantId)
                    .map(ParticipantAuditDescription::formatParticipantName)
                .filter(name -> !name.isBlank())
                .orElse("Participant");
    }

    static String formatParticipantName(Participant participant) {
        List<String> nameParts = new ArrayList<>();
        if (participant.getFirstName() != null && !participant.getFirstName().isBlank()) {
            nameParts.add(participant.getFirstName().trim());
        }
        if (participant.getMiddleName() != null && !participant.getMiddleName().isBlank()) {
            nameParts.add(participant.getMiddleName().trim());
        }
        if (participant.getLastName() != null && !participant.getLastName().isBlank()) {
            nameParts.add(participant.getLastName().trim());
        }
        return String.join(" ", nameParts);
    }
}
