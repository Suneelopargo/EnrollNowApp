package com.enrollnow.participant.services;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.repositories.StudyRequirementRepository;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    @Mock private StudyRequirementRepository studyRequirementRepository;
    @Mock private SiteAuthorizationService siteAuthorizationService;

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
        ReflectionTestUtils.setField(service, "studyRequirementRepository", studyRequirementRepository);
        ReflectionTestUtils.setField(service, "siteAuthorizationService", siteAuthorizationService);
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
    void createParticipant_minimalRequiredFields_persistsAuthoritativeMetadataAndNoOptionalEntities() {
        CreateParticipantRequest request = new CreateParticipantRequest();
        request.setFirstName("Alice");
        request.setLastName("Wonderland");

        UUID generatedId = UUID.randomUUID();
        when(participantRepository.save(any(Participant.class))).thenAnswer(invocation -> {
            Participant p = invocation.getArgument(0);
            p.setId(generatedId);
            return p;
        });

        when(participantRepository.findByTenantIdAndId(tenantId, generatedId)).thenAnswer(inv -> {
            Participant p = new Participant();
            p.setId(generatedId);
            p.setTenantId(tenantId);
            p.setSiteId(siteId);
            p.setFirstName("Alice");
            p.setLastName("Wonderland");
            p.setStatus("ACTIVE");
            p.setCreatedBy(userId);
            p.setCreatedAt(OffsetDateTime.now());
            p.setCustomAttributes("{\"creationSource\":\"registry\",\"creationInfo\":{\"creationSource\":\"registry\"}}");
            return Optional.of(p);
        });

        RegistryParticipantDto result = service.createParticipant(tenantId, siteId, userId, request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Alice Wonderland");
        assertThat(result.getFirstName()).isEqualTo("Alice");
        assertThat(result.getLastName()).isEqualTo("Wonderland");
        assertThat(result.getStudies()).isEmpty();
        assertThat(result.getTags()).isEmpty();
        assertThat(result.getPhone()).isEmpty();

        // Verify mandatory entities
        verify(identifierRepository).save(argThat(i ->
                "GLOBAL_ID".equals(i.getIdentifierType()) &&
                i.getIdentifierValue().startsWith("PART-") &&
                i.isPrimaryIdentifier()
        ));
        verify(preferenceRepository).save(argThat(pref ->
                !pref.isDoNotContact() &&
                "English".equals(pref.getPreferredLanguage()) &&
                pref.isAllowEmail() &&
                pref.isAllowSms() &&
                pref.isAllowPhone()
        ));

        // Verify NO optional entities saved
        verify(contactRepository, never()).save(any(ParticipantContact.class));
        verify(addressRepository, never()).save(any(ParticipantAddress.class));
        verify(candidateRepository, never()).save(any(StudyCandidate.class));
    }

    @Test
    void createParticipant_withMiddleName_persistsMiddleNameAndFullName() {
        CreateParticipantRequest request = new CreateParticipantRequest();
        request.setFirstName("John");
        request.setMiddleName("Quincy");
        request.setLastName("Adams");

        UUID generatedId = UUID.randomUUID();
        when(participantRepository.save(any(Participant.class))).thenAnswer(invocation -> {
            Participant p = invocation.getArgument(0);
            p.setId(generatedId);
            return p;
        });

        when(participantRepository.findByTenantIdAndId(tenantId, generatedId)).thenAnswer(inv -> {
            Participant p = new Participant();
            p.setId(generatedId);
            p.setTenantId(tenantId);
            p.setFirstName("John");
            p.setMiddleName("Quincy");
            p.setLastName("Adams");
            p.setStatus("ACTIVE");
            return Optional.of(p);
        });

        RegistryParticipantDto result = service.createParticipant(tenantId, siteId, userId, request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("John Quincy Adams");
        assertThat(result.getMiddleName()).isEqualTo("Quincy");
    }

    @Test
    void createParticipant_missingRequiredName_throwsIllegalArgumentException() {
        CreateParticipantRequest request = new CreateParticipantRequest();
        request.setFirstName("  ");
        request.setLastName("ValidLast");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () ->
                service.createParticipant(tenantId, siteId, userId, request));

        CreateParticipantRequest request2 = new CreateParticipantRequest();
        request2.setFirstName("ValidFirst");
        request2.setLastName("");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () ->
                service.createParticipant(tenantId, siteId, userId, request2));
    }

    @Test
    void createParticipant_withInvalidStudyId_throwsException() {
        CreateParticipantRequest request = new CreateParticipantRequest();
        request.setFirstName("Bob");
        request.setLastName("Ross");
        request.setStudyId("not-a-valid-uuid");

        UUID generatedId = UUID.randomUUID();
        when(participantRepository.save(any(Participant.class))).thenAnswer(invocation -> {
            Participant p = invocation.getArgument(0);
            p.setId(generatedId);
            return p;
        });

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () ->
                service.createParticipant(tenantId, siteId, userId, request));
    }

    @Test
    void findDuplicatesByName_excludesDeletedParticipants() {
        UUID activeId = UUID.randomUUID();
        Participant activePart = createMockParticipant(activeId, "John", "Doe", LocalDate.of(1990, 1, 1), "ACTIVE");

        when(participantRepository.findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCaseAndStatusNot(
                tenantId, "John", "Doe", "DELETED"))
                .thenReturn(List.of(activePart));
        when(participantRepository.findByTenantIdAndId(tenantId, activeId)).thenReturn(Optional.of(activePart));

        List<RegistryParticipantDto> duplicates = service.findDuplicatesByName(tenantId, "John", "Doe");

        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getName()).isEqualTo("John Doe");
        verify(participantRepository).findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCaseAndStatusNot(
                tenantId, "John", "Doe", "DELETED");
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
    void deleteParticipant_softDeletesAndRecordsHistory() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Dave", "Miller", LocalDate.of(1992, 4, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        service.deleteParticipant(tenantId, partId, userId);

        assertThat(p.getStatus()).isEqualTo("DELETED");
        verify(statusHistoryRepository).save(argThat(h ->
                "DELETED".equals(h.getNewStatus()) &&
                "ACTIVE".equals(h.getPreviousStatus()) &&
                partId.equals(h.getParticipantId())
        ));
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
    void searchParticipants_withDuplicatesOnly_inFallback_returnsOnlyDuplicateGroups() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        UUID id3 = UUID.randomUUID();
        UUID id4 = UUID.randomUUID();

        // id1 and id2 share the same name and date of birth (legacy Ripple duplicate rule: lastName, firstName, birthday)
        Participant p1 = createMockParticipant(id1, "John", "Doe", LocalDate.of(1990, 1, 1), "ACTIVE");
        Participant p2 = createMockParticipant(id2, "John", "Doe", LocalDate.of(1990, 1, 1), "ACTIVE");
        // id3 has the same name but different date of birth (e.g. grandfather born 1950 - not a duplicate of p1/p2)
        Participant p3 = createMockParticipant(id3, "John", "Doe", LocalDate.of(1950, 5, 10), "ACTIVE");
        // id4 is unique "Alice Unique"
        Participant p4 = createMockParticipant(id4, "Alice", "Unique", LocalDate.of(1985, 3, 15), "ACTIVE");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2, p3, p4));
        when(studyRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        RegistryPagedResponse<RegistryParticipantDto> response = service.searchParticipants(
                tenantId, null, null, "all", "all", null, null, true, 0, 25, "name", "asc"
        );

        assertThat(response).isNotNull();
        assertThat(response.getTotalCount()).isEqualTo(2);
        assertThat(response.getItems()).extracting(RegistryParticipantDto::getName)
                .containsExactly("John Doe", "John Doe");
    }

    @Test
    void findDuplicatesByName_returnsMatchingParticipants() {
        Participant p = createMockParticipant(UUID.randomUUID(), "Alice", "Walker", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCaseAndStatusNot(tenantId, "Alice", "Walker", "DELETED"))
                .thenReturn(List.of(p));
        when(participantRepository.findByTenantIdAndId(tenantId, p.getId()))
                .thenReturn(Optional.of(p));

        List<RegistryParticipantDto> duplicates = service.findDuplicatesByName(tenantId, "Alice", "Walker");
        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getFirstName()).isEqualTo("Alice");
    }

    @Test
    void generateStudyParticipantId_whenCustomIdEnabled_generatesFormattedIdAndIncrements() {
        Study study = new Study();
        study.setId(UUID.randomUUID());
        study.setTenantId(tenantId);
        study.setPrefix("ONCO");
        study.setCustomIdGenerationEnabled(true);
        study.setNextSequentialIdentifier(5);

        String id1 = service.generateStudyParticipantId(study);
        assertThat(id1).isEqualTo("ONCO00000006");
        assertThat(study.getNextSequentialIdentifier()).isEqualTo(6);
        verify(studyRepository).save(study);

        String id2 = service.generateStudyParticipantId(study);
        assertThat(id2).isEqualTo("ONCO00000007");
        assertThat(study.getNextSequentialIdentifier()).isEqualTo(7);
    }

    @Test
    void generateStudyParticipantId_whenCustomIdDisabled_generatesFallbackId() {
        Study study = new Study();
        study.setId(UUID.randomUUID());
        study.setTenantId(tenantId);
        study.setPrefix("ONCO");
        study.setCustomIdGenerationEnabled(false);
        study.setNextSequentialIdentifier(0);

        String id = service.generateStudyParticipantId(study);
        assertThat(id).startsWith("SP-");
        assertThat(study.getNextSequentialIdentifier()).isEqualTo(0);
        verify(studyRepository, never()).save(study);
    }

    @Test
    void assignStudy_withCustomIdEnabled_assignsFormattedIdAndCreatesIdentifier() {
        UUID participantId = UUID.randomUUID();
        UUID studyId = UUID.randomUUID();

        Study study = new Study();
        study.setId(studyId);
        study.setTenantId(tenantId);
        study.setStudyCode("STUDY-101");
        study.setPrefix("STUDY");
        study.setCustomIdGenerationEnabled(true);
        study.setNextSequentialIdentifier(0);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(participantRepository.existsById(participantId)).thenReturn(true);
        when(enrollmentRepository.findByTenantIdAndStudyIdAndParticipantId(tenantId, studyId, participantId))
                .thenReturn(Optional.empty());
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, participantId))
                .thenReturn(Collections.emptyList());

        AssignStudyRequest request = new AssignStudyRequest(participantId, studyId, "ENROLLED", "Enrolled participant");
        service.assignStudy(tenantId, userId, request);

        verify(enrollmentRepository).save(argThat(enrollment -> {
            assertThat(enrollment.getStudyParticipantId()).isEqualTo("STUDY00000001");
            assertThat(enrollment.getStatus()).isEqualTo("ENROLLED");
            return true;
        }));

        verify(identifierRepository).save(argThat(identifier -> {
            assertThat(identifier.getIdentifierType()).isEqualTo("STUDY_CUSTOM_ID");
            assertThat(identifier.getIdentifierValue()).isEqualTo("STUDY00000001");
            assertThat(identifier.getIssuingSystem()).isEqualTo("STUDY-101");
            return true;
        }));
    }

    @Test
    void getFilterMetadata_resolvesGlobalVariablesAuthoritatively() {
        UUID study1Id = UUID.randomUUID();
        UUID study2Id = UUID.randomUUID();

        StudyRequirement req1 = new StudyRequirement();
        req1.setStudyId(study1Id);
        req1.setTenantId(tenantId);
        req1.setConfiguration("{\"customVariables\":[{\"id\":\"blood_group\",\"name\":\"Blood Group\",\"type\":\"single\",\"isGlobal\":true,\"options\":[{\"label\":\"A+\",\"value\":\"A+\"}]}]}");

        StudyRequirement req2 = new StudyRequirement();
        req2.setStudyId(study2Id);
        req2.setTenantId(tenantId);
        req2.setConfiguration("{\"customVariables\":[{\"id\":\"blood_group\",\"name\":\"Blood Group\",\"type\":\"single\",\"isGlobal\":false,\"options\":[{\"label\":\"O+\",\"value\":\"O+\"}]}]}");

        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(List.of(req1, req2));

        List<Map<String, Object>> metadata = service.getFilterMetadata(tenantId, null);

        assertThat(metadata).hasSize(1);
        Map<String, Object> var = metadata.get(0);
        assertThat(var.get("id")).isEqualTo("custom_blood_group");
        assertThat(var.get("global")).isEqualTo(true);
        // Study copy cannot override global, but options can be merged
        @SuppressWarnings("unchecked")
        List<Map<String, String>> opts = (List<Map<String, String>>) var.get("options");
        assertThat(opts).isNotEmpty();
    }

    @Test
    void getFilterMetadata_studySpecificContext_onlyReturnsGlobalsAndTargetStudyVariables() {
        UUID targetStudyId = UUID.randomUUID();
        UUID otherStudyId = UUID.randomUUID();

        StudyRequirement reqTarget = new StudyRequirement();
        reqTarget.setStudyId(targetStudyId);
        reqTarget.setTenantId(tenantId);
        reqTarget.setConfiguration("{\"customVariables\":[{\"id\":\"target_var\",\"name\":\"Target Var\",\"type\":\"text\",\"isGlobal\":false}]}");

        StudyRequirement reqOther = new StudyRequirement();
        reqOther.setStudyId(otherStudyId);
        reqOther.setTenantId(tenantId);
        reqOther.setConfiguration("{\"customVariables\":[{\"id\":\"other_var\",\"name\":\"Other Var\",\"type\":\"text\",\"isGlobal\":false}]}");

        StudyRequirement reqGlobal = new StudyRequirement();
        reqGlobal.setStudyId(otherStudyId);
        reqGlobal.setTenantId(tenantId);
        reqGlobal.setConfiguration("{\"customVariables\":[{\"id\":\"global_var\",\"name\":\"Global Var\",\"type\":\"text\",\"isGlobal\":true}]}");

        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(List.of(reqTarget, reqOther, reqGlobal));

        List<Map<String, Object>> metadata = service.getFilterMetadata(tenantId, targetStudyId.toString());

        List<String> ids = metadata.stream().map(m -> (String) m.get("id")).toList();
        assertThat(ids).contains("custom_target_var", "custom_global_var");
        assertThat(ids).doesNotContain("custom_other_var");
    }

    @Test
    void getFilterMetadata_resolvesConflictingStudyVariablesDeterministically() {
        UUID study1Id = UUID.randomUUID();
        UUID study2Id = UUID.randomUUID();

        Study study1 = new Study();
        study1.setId(study1Id);
        study1.setName("Study One");

        Study study2 = new Study();
        study2.setId(study2Id);
        study2.setName("Study Two");

        when(studyRepository.findByTenantId(tenantId)).thenReturn(List.of(study1, study2));

        // Study 1 defines "Severity" as number, Study 2 defines "Severity" as single select
        StudyRequirement req1 = new StudyRequirement();
        req1.setStudyId(study1Id);
        req1.setTenantId(tenantId);
        req1.setConfiguration("{\"customVariables\":[{\"id\":\"severity\",\"name\":\"Severity\",\"type\":\"number\",\"isGlobal\":false}]}");

        StudyRequirement req2 = new StudyRequirement();
        req2.setStudyId(study2Id);
        req2.setTenantId(tenantId);
        req2.setConfiguration("{\"customVariables\":[{\"id\":\"severity\",\"name\":\"Severity\",\"type\":\"single\",\"isGlobal\":false}]}");

        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(List.of(req1, req2));

        List<Map<String, Object>> metadata = service.getFilterMetadata(tenantId, null);

        // Neither should be arbitrarily dropped: both should be disambiguated with study context
        assertThat(metadata).hasSize(2);
        List<String> labels = metadata.stream().map(m -> (String) m.get("label")).toList();
        assertThat(labels).anyMatch(l -> l.contains("Study One"));
        assertThat(labels).anyMatch(l -> l.contains("Study Two"));
    }

    @Test
    void getFilterMetadata_handlesMalformedJsonGracefully() {
        UUID study1Id = UUID.randomUUID();
        UUID study2Id = UUID.randomUUID();

        StudyRequirement badReq = new StudyRequirement();
        badReq.setStudyId(study1Id);
        badReq.setTenantId(tenantId);
        badReq.setConfiguration("{malformed:json, missing quotes");

        StudyRequirement goodReq = new StudyRequirement();
        goodReq.setStudyId(study2Id);
        goodReq.setTenantId(tenantId);
        goodReq.setConfiguration("{\"customVariables\":[{\"id\":\"valid_var\",\"name\":\"Valid Var\",\"type\":\"text\",\"isGlobal\":true}]}");

        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(List.of(badReq, goodReq));

        List<Map<String, Object>> metadata = service.getFilterMetadata(tenantId, null);

        // Does not throw exception and continues to load valid requirement
        assertThat(metadata).hasSize(1);
        assertThat(metadata.get(0).get("id")).isEqualTo("custom_valid_var");
    }

    @Test
    void validateFilterRules_acceptsValidRules() {
        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        List<CustomFilterRuleDto> rules = List.of(
                new CustomFilterRuleDto("1", "age", "between", "", "20", "50", null, ""),
                new CustomFilterRuleDto("2", "gender", "equal to", "Male", ""),
                new CustomFilterRuleDto("3", "city", "contains", "Chicago", "")
        );

        service.validateFilterRules(tenantId, rules);
    }

    @Test
    void validateFilterRules_rejectsUnknownField() {
        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        List<CustomFilterRuleDto> rules = List.of(
                new CustomFilterRuleDto("1", "unknown_field", "equal to", "val", "")
        );

        assertThrows(ResponseStatusException.class, () -> service.validateFilterRules(tenantId, rules));
    }

    @Test
    void validateFilterRules_rejectsUnsupportedOperatorForFieldType() {
        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        // "greater than" is not supported for text or select fields like "gender"
        List<CustomFilterRuleDto> rules = List.of(
                new CustomFilterRuleDto("1", "gender", "greater than", "Male", "")
        );

        assertThrows(ResponseStatusException.class, () -> service.validateFilterRules(tenantId, rules));
    }

    @Test
    void validateFilterRules_rejectsInvalidNumericAndDateRanges() {
        when(studyRequirementRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        // Inverted range min > max
        List<CustomFilterRuleDto> rules = List.of(
                new CustomFilterRuleDto("1", "age", "between", "", "60", "20", null, "")
        );

        assertThrows(ResponseStatusException.class, () -> service.validateFilterRules(tenantId, rules));

        // Missing range boundary
        List<CustomFilterRuleDto> missingBound = List.of(
                new CustomFilterRuleDto("2", "age", "between", "", "20", "", null, "")
        );

        assertThrows(ResponseStatusException.class, () -> service.validateFilterRules(tenantId, missingBound));
    }

    @Test
    void getParticipantTags_delegatesToRepository_whenRepositorySucceeds() {
        when(participantRepository.findDistinctTagsByTenantAndSearch(eq(tenantId), eq(siteId), eq("AD"), eq(20)))
                .thenReturn(List.of("ADRC", "Adult"));

        List<String> result = service.getParticipantTags(tenantId, siteId, "AD", 20);

        assertThat(result).containsExactly("ADRC", "Adult");
        verify(participantRepository).findDistinctTagsByTenantAndSearch(tenantId, siteId, "AD", 20);
    }

    @Test
    void getParticipantTags_fallsBackToInMemoryAggregation_whenNativeQueryFails() {
        when(participantRepository.findDistinctTagsByTenantAndSearch(any(), any(), any(), anyInt()))
                .thenThrow(new RuntimeException("Native query unsupported in test context"));

        Participant p1 = createMockParticipant(UUID.randomUUID(), "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        p1.setCustomAttributes("{\"tags\":[\"ADRC\",\"Echo\",\"Pediatric\"]}");

        Participant p2 = createMockParticipant(UUID.randomUUID(), "Bob", "Jones", LocalDate.of(1991, 2, 2), "ACTIVE");
        p2.setCustomAttributes("{\"tags\":[\"ADRC\",\"Echo\"]}");

        Participant p3 = createMockParticipant(UUID.randomUUID(), "Charlie", "Brown", LocalDate.of(1992, 3, 3), "ACTIVE");
        p3.setCustomAttributes("{\"tags\":[\"ADRC\"]}");

        Participant pDeleted = createMockParticipant(UUID.randomUUID(), "Deleted", "User", LocalDate.of(1993, 4, 4), "DELETED");
        pDeleted.setCustomAttributes("{\"tags\":[\"Echo\",\"EchoDeleted\"]}");

        when(participantRepository.findByTenantId(tenantId)).thenReturn(List.of(p1, p2, p3, pDeleted));

        // Search for substring "e" (case-insensitive) -> "Echo" (count 2), "Pediatric" (count 1)
        List<String> result = service.getParticipantTags(tenantId, null, "e", 20);

        assertThat(result).containsExactly("Echo", "Pediatric");
        assertThat(result).doesNotContain("EchoDeleted"); // deleted participant excluded
    }

    @Test
    void getParticipantTags_normalizesLimits() {
        when(participantRepository.findDistinctTagsByTenantAndSearch(eq(tenantId), isNull(), isNull(), eq(20)))
                .thenReturn(List.of("ADRC"));

        service.getParticipantTags(tenantId, null, null, -5);
        verify(participantRepository).findDistinctTagsByTenantAndSearch(tenantId, null, null, 20);

        service.getParticipantTags(tenantId, null, null, 500);
        verify(participantRepository).findDistinctTagsByTenantAndSearch(tenantId, null, null, 100);
    }

    @Test
    void updateParticipant_normalizesAndDeduplicatesTags_withoutInjectingFakeDefaults() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Dave", "Miller", LocalDate.of(1992, 4, 1), "ACTIVE");
        p.setCustomAttributes("{\"existingKey\":\"existingValue\"}");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setTags(List.of("  Healthy ", "healthy", "", "   ", "ADRC"));

        service.updateParticipant(tenantId, partId, userId, req);

        assertThat(p.getCustomAttributes()).contains("\"tags\":[\"Healthy\",\"ADRC\"]");
        assertThat(p.getCustomAttributes()).contains("\"existingKey\":\"existingValue\"");

        // When tags is empty list, verify it does not inject "New Participant"
        req.setTags(Collections.emptyList());
        service.updateParticipant(tenantId, partId, userId, req);
        assertThat(p.getCustomAttributes()).contains("\"tags\":[]");
        assertThat(p.getCustomAttributes()).doesNotContain("New Participant");
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
    @Test
    void getTimezoneOptions_returnsFullSetOfSortedTimezones() {
        List<String> options = service.getTimezoneOptions();

        assertThat(options).isNotEmpty();
        assertThat(options).contains("UTC", "America/New_York", "Europe/London", "Asia/Tokyo");

        // Verify alphabetically sorted
        List<String> sorted = new ArrayList<>(options);
        Collections.sort(sorted);
        assertThat(options).isEqualTo(sorted);
    }

    @Test
    void getParticipantById_whenTimezoneNotSet_returnsNullTimezoneWithoutFakeFallback() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());
        when(contactRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());
        when(preferenceRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Optional.empty());
        when(addressRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());
        when(candidateRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());

        Optional<RegistryParticipantDto> dtoOpt = service.getParticipantById(tenantId, partId);

        assertThat(dtoOpt).isPresent();
        assertThat(dtoOpt.get().getTimezone()).isNull();
    }

    @Test
    void getParticipantById_whenTimezonePersisted_returnsPersistedTimezone() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());
        when(contactRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());

        ParticipantPreference pref = new ParticipantPreference();
        pref.setTenantId(tenantId);
        pref.setParticipantId(partId);
        pref.setTimezone("Europe/London");
        when(preferenceRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Optional.of(pref));
        when(addressRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());
        when(candidateRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());

        Optional<RegistryParticipantDto> dtoOpt = service.getParticipantById(tenantId, partId);

        assertThat(dtoOpt).isPresent();
        assertThat(dtoOpt.get().getTimezone()).isEqualTo("Europe/London");
    }

    @Test
    void updateParticipant_withValidTimezone_persistsTimezone() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());

        ParticipantPreference pref = new ParticipantPreference();
        pref.setTenantId(tenantId);
        pref.setParticipantId(partId);
        when(preferenceRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Optional.of(pref));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setTimezone("America/Chicago");

        service.updateParticipant(tenantId, partId, userId, req);

        verify(preferenceRepository).save(argThat(savedPref -> "America/Chicago".equals(savedPref.getTimezone())));
    }

    @Test
    void updateParticipant_withEmptyTimezone_clearsPersistedTimezone() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Collections.emptyList());

        ParticipantPreference pref = new ParticipantPreference();
        pref.setTenantId(tenantId);
        pref.setParticipantId(partId);
        pref.setTimezone("America/New_York");
        when(preferenceRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(Optional.of(pref));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setTimezone("   ");

        service.updateParticipant(tenantId, partId, userId, req);

        verify(preferenceRepository).save(argThat(savedPref -> savedPref.getTimezone() == null));
    }

    @Test
    void updateParticipant_withInvalidTimezone_throwsBadRequest() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setTimezone("Mars/Curiosity_Base");

        org.springframework.web.server.ResponseStatusException ex = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.updateParticipant(tenantId, partId, userId, req)
        );

        assertThat(ex.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).contains("Invalid timezone");
    }

    @Test
    void updateParticipant_withModifiedGlobalId_whenUnauthorized_throwsAccessDenied() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        ParticipantIdentifier existingId = new ParticipantIdentifier();
        existingId.setTenantId(tenantId);
        existingId.setParticipantId(partId);
        existingId.setIdentifierType("GLOBAL_ID");
        existingId.setIdentifierValue("OLD-GLB-1");
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(List.of(existingId));

        doThrow(new org.springframework.security.access.AccessDeniedException("Access denied: Site Administration access requires SITE_MANAGER or SITE_ADMIN role"))
                .when(siteAuthorizationService).requireSiteAdminAccess(tenantId, siteId);

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setGlobalId("NEW-GLB-2");

        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> service.updateParticipant(tenantId, partId, userId, req, siteId)
        );

        verify(identifierRepository, never()).save(any(ParticipantIdentifier.class));
    }

    @Test
    void updateParticipant_withBlankGlobalId_throwsBadRequest() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        ParticipantIdentifier existingId = new ParticipantIdentifier();
        existingId.setTenantId(tenantId);
        existingId.setParticipantId(partId);
        existingId.setIdentifierType("GLOBAL_ID");
        existingId.setIdentifierValue("OLD-GLB-1");
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(List.of(existingId));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setGlobalId("   ");

        org.springframework.web.server.ResponseStatusException ex = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.updateParticipant(tenantId, partId, userId, req, siteId)
        );

        assertThat(ex.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).contains("Global ID cannot be blank");
    }

    @Test
    void updateParticipant_withDuplicateGlobalId_throwsConflict() {
        UUID partId = UUID.randomUUID();
        UUID otherPartId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        ParticipantIdentifier existingId = new ParticipantIdentifier();
        existingId.setTenantId(tenantId);
        existingId.setParticipantId(partId);
        existingId.setIdentifierType("GLOBAL_ID");
        existingId.setIdentifierValue("OLD-GLB-1");
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(List.of(existingId));

        ParticipantIdentifier otherDuplicate = new ParticipantIdentifier();
        otherDuplicate.setTenantId(tenantId);
        otherDuplicate.setParticipantId(otherPartId);
        otherDuplicate.setIdentifierType("GLOBAL_ID");
        otherDuplicate.setIdentifierValue("EXISTING-ID");
        when(identifierRepository.findGlobalIdIgnoreCase(tenantId, "EXISTING-ID")).thenReturn(Optional.of(otherDuplicate));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setGlobalId("EXISTING-ID");

        org.springframework.web.server.ResponseStatusException ex = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.updateParticipant(tenantId, partId, userId, req, siteId)
        );

        assertThat(ex.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.CONFLICT);
        assertThat(ex.getReason()).isEqualTo("Global ID Already Exists");
    }

    @Test
    void updateParticipant_withUnchangedGlobalId_doesNotRequireSiteAdminAndPreserves() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        ParticipantIdentifier existingId = new ParticipantIdentifier();
        existingId.setTenantId(tenantId);
        existingId.setParticipantId(partId);
        existingId.setIdentifierType("GLOBAL_ID");
        existingId.setIdentifierValue("SAME-GLB-1");
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(List.of(existingId));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setGlobalId("SAME-GLB-1");
        req.setFirstName("Alicia");

        service.updateParticipant(tenantId, partId, userId, req, siteId);

        // Verification: requireSiteAdminAccess is NOT called for unchanged Global ID
        verify(siteAuthorizationService, never()).requireSiteAdminAccess(any(), any());
        assertThat(p.getFirstName()).isEqualTo("Alicia");
    }

    @Test
    void updateParticipant_withNullGlobalId_preservesExistingGlobalId() {
        UUID partId = UUID.randomUUID();
        Participant p = createMockParticipant(partId, "Alice", "Smith", LocalDate.of(1990, 1, 1), "ACTIVE");
        when(participantRepository.findByTenantIdAndId(tenantId, partId)).thenReturn(Optional.of(p));

        ParticipantIdentifier existingId = new ParticipantIdentifier();
        existingId.setTenantId(tenantId);
        existingId.setParticipantId(partId);
        existingId.setIdentifierType("GLOBAL_ID");
        existingId.setIdentifierValue("PERSISTED-GLB");
        when(identifierRepository.findByTenantIdAndParticipantId(tenantId, partId)).thenReturn(List.of(existingId));

        UpdateParticipantRequest req = new UpdateParticipantRequest();
        req.setLastName("Jones");
        req.setGlobalId(null);

        service.updateParticipant(tenantId, partId, userId, req, siteId);

        verify(siteAuthorizationService, never()).requireSiteAdminAccess(any(), any());
        verify(identifierRepository, never()).save(any(ParticipantIdentifier.class));
        assertThat(p.getLastName()).isEqualTo("Jones");
    }

}
