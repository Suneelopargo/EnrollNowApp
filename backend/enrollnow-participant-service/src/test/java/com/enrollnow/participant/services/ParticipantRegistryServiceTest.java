package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantRegistryServiceTest {

    @Mock private ParticipantRepository participantRepository;
    @Mock private ParticipantIdentifierRepository identifierRepository;
    @Mock private ParticipantContactRepository contactRepository;
    @Mock private ParticipantAddressRepository addressRepository;
    @Mock private ParticipantPreferenceRepository preferenceRepository;
    @Mock private ParticipantStatusHistoryRepository statusHistoryRepository;
    @Mock private StudyCandidateRepository candidateRepository;
    @Mock private StudyEnrollmentRepository enrollmentRepository;
    @Mock private StudyRepository studyRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ParticipantRegistryService service;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID siteId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new ParticipantRegistryService(
                participantRepository,
                identifierRepository,
                contactRepository,
                addressRepository,
                preferenceRepository,
                statusHistoryRepository,
                candidateRepository,
                enrollmentRepository,
                studyRepository,
                objectMapper
        );
    }

    @Test
    void searchParticipants_returnsPagedResults() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "Smith", LocalDate.of(1990, 5, 12), "ACTIVE");
        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "Jones", LocalDate.of(1985, 3, 20), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2));
        when(studyRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        RegistryPagedResponse<RegistryParticipantDto> response = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, null, 0, 10, "name", "asc"
        );

        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getTotalCount()).isEqualTo(2);
        assertThat(response.getItems().get(0).getName()).isEqualTo("Alice Smith");
        assertThat(response.getItems().get(1).getName()).isEqualTo("Bob Jones");
    }

    @Test
    void searchParticipants_filtersBySearchTerm() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "Smith", LocalDate.of(1990, 5, 12), "ACTIVE");
        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "Jones", LocalDate.of(1985, 3, 20), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2));

        RegistryPagedResponse<RegistryParticipantDto> response = service.searchParticipants(
                tenantId, siteId, "Alice", "all", "all", null, null, 0, 10, "name", "asc"
        );

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getFirstName()).isEqualTo("Alice");
    }

    @Test
    void searchParticipants_filtersByContactability() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Participant p1 = createMockParticipant(id1, "Alice", "Smith", LocalDate.of(1990, 5, 12), "ACTIVE");
        Participant p2 = createMockParticipant(id2, "Bob", "Jones", LocalDate.of(1985, 3, 20), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2));

        ParticipantPreference pref1 = new ParticipantPreference();
        pref1.setParticipantId(id1);
        pref1.setTenantId(tenantId);
        pref1.setDoNotContact(false); // Can contact

        ParticipantPreference pref2 = new ParticipantPreference();
        pref2.setParticipantId(id2);
        pref2.setTenantId(tenantId);
        pref2.setDoNotContact(true); // Do not contact

        when(preferenceRepository.findByTenantIdAndParticipantIdIn(eq(tenantId), any())).thenReturn(List.of(pref1, pref2));

        RegistryPagedResponse<RegistryParticipantDto> yesResponse = service.searchParticipants(
                tenantId, siteId, null, "yes", "all", null, null, 0, 10, "name", "asc"
        );
        assertThat(yesResponse.getItems()).hasSize(1);
        assertThat(yesResponse.getItems().get(0).getId()).isEqualTo(id1.toString());

        RegistryPagedResponse<RegistryParticipantDto> noResponse = service.searchParticipants(
                tenantId, siteId, null, "no", "all", null, null, 0, 10, "name", "asc"
        );
        assertThat(noResponse.getItems()).hasSize(1);
        assertThat(noResponse.getItems().get(0).getId()).isEqualTo(id2.toString());
    }

    @Test
    void searchParticipants_filtersByAvailability() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Participant p1 = createMockParticipant(id1, "Alice", "Smith", LocalDate.of(1990, 5, 12), "ACTIVE");
        Participant p2 = createMockParticipant(id2, "Bob", "Jones", LocalDate.of(1985, 3, 20), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2));

        // Study allowing other studies
        Study studyA = new Study();
        studyA.setId(UUID.randomUUID());
        studyA.setName("Study A");
        studyA.setAllowParticipationInOtherStudies(true);

        // Exclusive study not allowing other studies
        Study studyB = new Study();
        studyB.setId(UUID.randomUUID());
        studyB.setName("Study B");
        studyB.setAllowParticipationInOtherStudies(false);

        when(studyRepository.findByTenantId(tenantId)).thenReturn(List.of(studyA, studyB));

        // Bob is enrolled in Study B
        StudyEnrollment enrollmentBob = new StudyEnrollment();
        enrollmentBob.setParticipantId(id2);
        enrollmentBob.setStudyId(studyB.getId());
        enrollmentBob.setActive(true);

        when(enrollmentRepository.findByTenantIdAndParticipantIdIn(eq(tenantId), any())).thenReturn(List.of(enrollmentBob));

        // Available participants (Alice in no study or study allowing others)
        RegistryPagedResponse<RegistryParticipantDto> availResponse = service.searchParticipants(
                tenantId, siteId, null, "all", "yes", null, null, 0, 10, "name", "asc"
        );
        assertThat(availResponse.getItems()).hasSize(1);
        assertThat(availResponse.getItems().get(0).getId()).isEqualTo(id1.toString());

        // Unavailable participants (Bob in Study B)
        RegistryPagedResponse<RegistryParticipantDto> unavailResponse = service.searchParticipants(
                tenantId, siteId, null, "all", "no", null, null, 0, 10, "name", "asc"
        );
        assertThat(unavailResponse.getItems()).hasSize(1);
        assertThat(unavailResponse.getItems().get(0).getId()).isEqualTo(id2.toString());
    }

    @Test
    void searchParticipants_appliesCustomFilterRules() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "Smith", LocalDate.of(1980, 1, 1), "ACTIVE");
        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "Jones", LocalDate.of(2010, 1, 1), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2));

        CustomFilterRuleDto rule = new CustomFilterRuleDto("1", "age", ">", "30", "");

        RegistryPagedResponse<RegistryParticipantDto> response = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(rule), 0, 10, "name", "asc"
        );

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getFirstName()).isEqualTo("Alice");
    }

    @Test
    void searchParticipants_filtersByBirthMonth() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "Smith", LocalDate.of(1990, 3, 15), "ACTIVE");
        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "Jones", LocalDate.of(1985, 7, 22), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2));

        CustomFilterRuleDto ruleMonthName = new CustomFilterRuleDto("1", "birthMonth", "equal to", "March", "");
        RegistryPagedResponse<RegistryParticipantDto> response1 = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(ruleMonthName), 0, 10, "name", "asc"
        );
        assertThat(response1.getItems()).hasSize(1);
        assertThat(response1.getItems().get(0).getFirstName()).isEqualTo("Alice");

        CustomFilterRuleDto ruleMonthNumber = new CustomFilterRuleDto("2", "birthMonth", "equal to", "7", "");
        RegistryPagedResponse<RegistryParticipantDto> response2 = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(ruleMonthNumber), 0, 10, "name", "asc"
        );
        assertThat(response2.getItems()).hasSize(1);
        assertThat(response2.getItems().get(0).getFirstName()).isEqualTo("Bob");
    }

    @Test
    void searchParticipants_usesDatabaseSpecificationQueryPath_whenRepositoryReturnsPage() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "David", "Tennant", LocalDate.of(1971, 4, 10), "ACTIVE");
        Page<Participant> mockPage = new PageImpl<>(List.of(p1));

        when(participantRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        RegistryPagedResponse<RegistryParticipantDto> response = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, null, 0, 25, "name", "asc"
        );

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getFirstName()).isEqualTo("David");
        assertThat(response.getTotalCount()).isEqualTo(1);
        verify(participantRepository).findAll(any(Specification.class), any(Pageable.class));
        // Verifies tenant-wide in-memory fetch is bypassed when specification query returns results
        verify(participantRepository, never()).findByTenantId(tenantId);
    }

    @Test
    void searchParticipants_supportsBetweenAndNotBetweenRangeOperators() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "Young", LocalDate.of(1995, 1, 1), "ACTIVE"); // ~31
        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "Middle", LocalDate.of(1980, 1, 1), "ACTIVE"); // ~46
        Participant p3 = createMockParticipant(UUID.randomUUID(), "Charlie", "Old", LocalDate.of(1950, 1, 1), "ACTIVE"); // ~76

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2, p3));

        CustomFilterRuleDto betweenRule = new CustomFilterRuleDto("1", "age", "between", "", "40", "50", null, "");
        RegistryPagedResponse<RegistryParticipantDto> responseBetween = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(betweenRule), 0, 10, "name", "asc"
        );
        assertThat(responseBetween.getItems()).hasSize(1);
        assertThat(responseBetween.getItems().get(0).getFirstName()).isEqualTo("Bob");

        CustomFilterRuleDto notBetweenRule = new CustomFilterRuleDto("2", "age", "not between", "", "40", "50", null, "");
        RegistryPagedResponse<RegistryParticipantDto> responseNotBetween = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(notBetweenRule), 0, 10, "name", "asc"
        );
        assertThat(responseNotBetween.getItems()).hasSize(2);
        assertThat(responseNotBetween.getItems()).extracting(RegistryParticipantDto::getFirstName)
                .containsExactlyInAnyOrder("Alice", "Charlie");
    }

    @Test
    void searchParticipants_supportsMultiSelectValues() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "Female", LocalDate.of(1990, 1, 1), "ACTIVE");
        p1.setSexAtBirth("Female");
        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "Male", LocalDate.of(1990, 1, 1), "ACTIVE");
        p2.setSexAtBirth("Male");
        Participant p3 = createMockParticipant(UUID.randomUUID(), "Charlie", "Other", LocalDate.of(1990, 1, 1), "ACTIVE");
        p3.setSexAtBirth("Other");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2, p3));

        CustomFilterRuleDto multiRule = new CustomFilterRuleDto("1", "gender", "equal to", "", "", "", List.of("Female", "Other"), "");
        RegistryPagedResponse<RegistryParticipantDto> response = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(multiRule), 0, 10, "name", "asc"
        );
        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getItems()).extracting(RegistryParticipantDto::getFirstName)
                .containsExactlyInAnyOrder("Alice", "Charlie");
    }

    @Test
    void searchParticipants_supportsAssignedAndNotAssignedOperators() {
        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "WithCity", LocalDate.of(1990, 1, 1), "ACTIVE");
        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "NoCity", LocalDate.of(1990, 1, 1), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2));

        ParticipantAddress addr1 = new ParticipantAddress();
        addr1.setParticipantId(p1.getId());
        addr1.setTenantId(tenantId);
        addr1.setCity("Philadelphia");
        addr1.setPrimaryAddress(true);

        when(addressRepository.findByTenantIdAndParticipantIdIn(eq(tenantId), any())).thenReturn(List.of(addr1));

        CustomFilterRuleDto assignedRule = new CustomFilterRuleDto("1", "city", "has any value", "", "");
        RegistryPagedResponse<RegistryParticipantDto> response1 = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(assignedRule), 0, 10, "name", "asc"
        );
        assertThat(response1.getItems()).hasSize(1);
        assertThat(response1.getItems().get(0).getFirstName()).isEqualTo("Alice");

        CustomFilterRuleDto notAssignedRule = new CustomFilterRuleDto("2", "city", "has no value", "", "");
        RegistryPagedResponse<RegistryParticipantDto> response2 = service.searchParticipants(
                tenantId, siteId, null, "all", "all", null, List.of(notAssignedRule), 0, 10, "name", "asc"
        );
        assertThat(response2.getItems()).hasSize(1);
        assertThat(response2.getItems().get(0).getFirstName()).isEqualTo("Bob");
    }

    @Test
    void createParticipant_createsChildEntities() {
        CreateParticipantRequest request = new CreateParticipantRequest();
        request.setFirstName("Charlie");
        request.setLastName("Brown");
        request.setDateOfBirth("1995-10-15");
        request.setPrimaryEmail("charlie@example.com");
        request.setPhone("555-1234");
        request.setCity("Philadelphia");
        request.setState("PA");
        request.setPostalCode("19104");

        UUID generatedId = UUID.randomUUID();
        when(participantRepository.save(any(Participant.class))).thenAnswer(invocation -> {
            Participant p = invocation.getArgument(0);
            p.setId(generatedId);
            return p;
        });

        when(participantRepository.findByTenantIdAndId(tenantId, generatedId)).thenAnswer(inv -> {
            Participant p = createMockParticipant(generatedId, "Charlie", "Brown", LocalDate.of(1995, 10, 15), "ACTIVE");
            return Optional.of(p);
        });

        RegistryParticipantDto result = service.createParticipant(tenantId, siteId, userId, request);

        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("Charlie");
        verify(identifierRepository).save(any(ParticipantIdentifier.class));
        verify(contactRepository, times(2)).save(any(ParticipantContact.class));
        verify(addressRepository).save(any(ParticipantAddress.class));
        verify(preferenceRepository).save(any(ParticipantPreference.class));
    }

    @Test
    void updateParticipantStatus_savesHistory() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Dave", "Miller", LocalDate.of(1992, 4, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        service.updateParticipantStatus(tenantId, partId, userId, "INACTIVE");

        assertThat(p.getStatus()).isEqualTo("INACTIVE");
        verify(statusHistoryRepository).save(any(ParticipantStatusHistory.class));
    }

    @Test
    void updateParticipant_updatesPrimaryEmailAndPhone() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Dave", "Miller", LocalDate.of(1992, 4, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setPrimaryEmail("dave.updated@example.com");
        req.setPhone("+1 (555) 999-0000");

        service.updateParticipant(tenantId, partId, userId, req);

        verify(contactRepository, atLeastOnce()).save(any(ParticipantContact.class));
    }

    @Test
    void assignStudy_supportsBulkAssignmentAndStudyNameLookup() {
        UUID p1 = UUID.randomUUID();
        UUID p2 = UUID.randomUUID();

        when(participantRepository.existsById(p1)).thenReturn(true);
        when(participantRepository.existsById(p2)).thenReturn(true);

        Study study = new Study();
        study.setId(UUID.randomUUID());
        study.setName("Autism Study");
        when(studyRepository.findByTenantId(tenantId)).thenReturn(List.of(study));

        AssignStudyRequest req = new AssignStudyRequest();
        req.setParticipantIds(List.of(p1, p2));
        req.setStudyName("Autism Study");
        req.setStatus("REFERRED");

        service.assignStudy(tenantId, userId, req);

        verify(candidateRepository, times(2)).save(any(StudyCandidate.class));
    }

    @Test
    void searchParticipants_enforcesStrictSiteScoping_andTenantWideWhenNullSite() {
        UUID siteA = siteId;
        UUID siteB = UUID.randomUUID();

        Participant pSiteA = createMockParticipant(UUID.randomUUID(), "Alice", "SiteA", LocalDate.of(1990, 1, 1), "ACTIVE");
        pSiteA.setSiteId(siteA);

        Participant pSiteB = createMockParticipant(UUID.randomUUID(), "Bob", "SiteB", LocalDate.of(1991, 2, 2), "ACTIVE");
        pSiteB.setSiteId(siteB);

        Participant pNullSite = createMockParticipant(UUID.randomUUID(), "Charlie", "Global", LocalDate.of(1992, 3, 3), "ACTIVE");
        pNullSite.setSiteId(null);

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(pSiteA, pSiteB, pNullSite));

        // Site-scoped query for Site A: strictly pSiteA only (null-site participant must NOT leak into site-scoped results)
        RegistryPagedResponse<RegistryParticipantDto> siteAResponse = service.searchParticipants(
                tenantId, siteA, null, "all", "all", null, null, 0, 10, "name", "asc"
        );
        assertThat(siteAResponse.getItems()).hasSize(1);
        assertThat(siteAResponse.getItems().get(0).getLastName()).isEqualTo("SiteA");

        // Tenant-wide query (siteId == null): returns all 3 participants (siteA, siteB, and unassigned/global)
        RegistryPagedResponse<RegistryParticipantDto> tenantWideResponse = service.searchParticipants(
                tenantId, null, null, "all", "all", null, null, 0, 10, "name", "asc"
        );
        assertThat(tenantWideResponse.getItems()).hasSize(3);
    }

    @Test
    void searchParticipants_usesDatabaseSpecificationExecutor_whenJpaAvailable() {
        UUID id1 = UUID.randomUUID();
        Participant p1 = createMockParticipant(id1, "Diana", "Prince", LocalDate.of(1984, 10, 25), "ACTIVE");
        Page<Participant> mockPage = new PageImpl<>(List.of(p1), PageRequest.of(0, 25), 1);

        when(participantRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(mockPage);
        when(studyRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        RegistryPagedResponse<RegistryParticipantDto> response = service.searchParticipants(
                tenantId, siteId, "Diana", "all", "all", null, null, 0, 25, "name", "asc"
        );

        assertThat(response).isNotNull();
        assertThat(response.getTotalCount()).isEqualTo(1);
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getName()).isEqualTo("Diana Prince");

        // Verify that database-level specification query was executed
        verify(participantRepository).findAll(any(Specification.class), any(Pageable.class));

        // Verify that tenant-wide in-memory fallback was NOT invoked
        verify(participantRepository, never()).findByTenantId(any());

        // Verify that related entity batch lookups were constrained only to the single ID on the page
        verify(identifierRepository).findByTenantIdAndParticipantIdIn(tenantId, List.of(id1));
        verify(contactRepository).findByTenantIdAndParticipantIdIn(tenantId, List.of(id1));
        verify(addressRepository).findByTenantIdAndParticipantIdIn(tenantId, List.of(id1));
    }

    @Test
    void findDuplicatesByName_returnsMatchingParticipants() {
        Participant p = createMockParticipant(UUID.randomUUID(), "Alice", "Walker", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCase(tenantId, "Alice", "Walker"))
                .thenReturn(List.of(p));
        when(participantRepository.findByTenantIdAndId(tenantId, p.getId()))
                .thenReturn(Optional.of(p));

        List<RegistryParticipantDto> duplicates = service.findDuplicatesByName(tenantId, "Alice", "Walker");
        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getFirstName()).isEqualTo("Alice");
    }

    private Participant createMockParticipant(UUID id, String firstName, String lastName, LocalDate dob, String status) {
        Participant p = new Participant();
        p.setId(id);
        p.setTenantId(tenantId);
        p.setSiteId(siteId);
        p.setFirstName(firstName);
        p.setLastName(lastName);
        p.setDateOfBirth(dob);
        p.setStatus(status);
        p.setCreatedAt(OffsetDateTime.now());
        p.setUpdatedAt(OffsetDateTime.now());
        return p;
    }
}
