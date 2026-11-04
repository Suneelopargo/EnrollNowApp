package com.enrollnow.participant.services;

import com.enrollnow.participant.models.Participant;
import com.enrollnow.participant.repositories.ParticipantRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ParticipantAuditEventDescriptionResolverTest {

    @Test
    void resolveDescription_replacesParticipantIdWithName() {
        UUID tenantId = UUID.randomUUID();
        UUID participantId = UUID.randomUUID();
        Participant participant = new Participant();
        participant.setFirstName("Alice");
        participant.setLastName("Smith");
        ParticipantRepository repository = mock(ParticipantRepository.class);
        when(repository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(participant));
        ParticipantAuditEventDescriptionResolver resolver = new ParticipantAuditEventDescriptionResolver(repository);

        assertEquals(
                "Deleted contact on participant Alice Smith",
                resolver.resolveDescription(
                        tenantId,
                        "Deleted contact on participant " + participantId));
    }

    @Test
    void resolveDescription_returnsNullWhenDescriptionNeedsNoResolution() {
        ParticipantAuditEventDescriptionResolver resolver =
                new ParticipantAuditEventDescriptionResolver(mock(ParticipantRepository.class));

        assertNull(resolver.resolveDescription(UUID.randomUUID(), "Deleted contact on participant Alice Smith"));
    }
}
