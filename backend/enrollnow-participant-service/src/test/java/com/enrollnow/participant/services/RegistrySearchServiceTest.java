package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.RegistrySearchRequest;
import com.enrollnow.participant.dtos.RegistrySearchResponse;
import com.enrollnow.participant.repositories.memory.InMemoryRegistryParticipantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RegistrySearchServiceTest {
    private RegistrySearchService service;

    @BeforeEach
    void setUp() {
        InMemoryRegistryParticipantRepository repository = new InMemoryRegistryParticipantRepository();
        repository.seed();
        service = new RegistrySearchService(repository, new RegistryMapper());
    }

    @Test
    void returnsPagedParticipants() {
        RegistrySearchRequest request = new RegistrySearchRequest();
        request.setPage(0);
        request.setSize(2);

        RegistrySearchResponse response = service.search(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), request);

        assertEquals(2, response.getContent().size());
        assertEquals(5, response.getTotalElements());
        assertEquals(3, response.getTotalPages());
    }

    @Test
    void filtersBySearchText() {
        RegistrySearchRequest request = new RegistrySearchRequest();
        request.setSearchText("Jackson");

        RegistrySearchResponse response = service.search(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), request);

        assertEquals(1, response.getTotalElements());
        assertTrue(response.getContent().get(0).getName().contains("Jackson"));
    }

}
