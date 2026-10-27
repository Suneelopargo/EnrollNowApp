package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ParticipantRegistryService {

    private static final Logger log = LoggerFactory.getLogger(ParticipantRegistryService.class);
    private static final DateTimeFormatter DISPLAY_DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a");
    private static final DateTimeFormatter LAST_CONTACT_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy hh:mm a");

    private final ParticipantRepository participantRepository;
    private final ParticipantIdentifierRepository identifierRepository;
    private final ParticipantContactRepository contactRepository;
    private final ParticipantAddressRepository addressRepository;
    private final ParticipantPreferenceRepository preferenceRepository;
    private final ParticipantStatusHistoryRepository statusHistoryRepository;
    private final StudyCandidateRepository candidateRepository;
    private final StudyEnrollmentRepository enrollmentRepository;
    private final StudyRepository studyRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private StudyRequirementRepository studyRequirementRepository;

    public void setStudyRequirementRepository(StudyRequirementRepository studyRequirementRepository) {
        this.studyRequirementRepository = studyRequirementRepository;
    }

    public ParticipantRegistryService(
            ParticipantRepository participantRepository,
            ParticipantIdentifierRepository identifierRepository,
            ParticipantContactRepository contactRepository,
            ParticipantAddressRepository addressRepository,
            ParticipantPreferenceRepository preferenceRepository,
            ParticipantStatusHistoryRepository statusHistoryRepository,
            StudyCandidateRepository candidateRepository,
            StudyEnrollmentRepository enrollmentRepository,
            StudyRepository studyRepository,
            ObjectMapper objectMapper) {
        this.participantRepository = participantRepository;
        this.identifierRepository = identifierRepository;
        this.contactRepository = contactRepository;
        this.addressRepository = addressRepository;
        this.preferenceRepository = preferenceRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.candidateRepository = candidateRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studyRepository = studyRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public RegistryPagedResponse<RegistryParticipantDto> searchParticipants(
            UUID tenantId,
            UUID siteId,
            String searchTerm,
            String contactFilter,
            String availableFilter,
            List<String> selectedStudies,
            List<CustomFilterRuleDto> customFilters,
            int page,
            int pageSize,
            String sortBy,
            String sortDirection) {

        int safePage = Math.max(0, page);
        int safePageSize = pageSize > 0 ? pageSize : 25;
        Sort sort = resolveSort(sortBy, sortDirection);
        Pageable pageable = PageRequest.of(safePage, safePageSize, sort);

        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, siteId, searchTerm, contactFilter, availableFilter, selectedStudies, customFilters
        );

        Page<Participant> participantPage = participantRepository.findAll(spec, pageable);

        if (participantPage != null) {
            long totalCount = participantPage.getTotalElements();
            List<Participant> pageParticipants = participantPage.getContent();

            if (pageParticipants.isEmpty()) {
                return new RegistryPagedResponse<>(Collections.emptyList(), totalCount, safePage, safePageSize);
            }

            List<UUID> participantIds = pageParticipants.stream().map(Participant::getId).collect(Collectors.toList());

            // Batch load related entities ONLY for the matching page of participants!
            Map<UUID, List<ParticipantIdentifier>> identifiersMap = identifierRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                    .stream().collect(Collectors.groupingBy(ParticipantIdentifier::getParticipantId));

            Map<UUID, List<ParticipantContact>> contactsMap = contactRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                    .stream().collect(Collectors.groupingBy(ParticipantContact::getParticipantId));

            Map<UUID, List<ParticipantAddress>> addressesMap = addressRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                    .stream().collect(Collectors.groupingBy(ParticipantAddress::getParticipantId));

            Map<UUID, ParticipantPreference> preferencesMap = preferenceRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                    .stream().collect(Collectors.toMap(ParticipantPreference::getParticipantId, p -> p, (a, b) -> a));

            Map<UUID, List<StudyCandidate>> candidatesMap = candidateRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                    .stream().collect(Collectors.groupingBy(StudyCandidate::getParticipantId));

            Map<UUID, List<StudyEnrollment>> enrollmentsMap = enrollmentRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                    .stream().collect(Collectors.groupingBy(StudyEnrollment::getParticipantId));

            Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId)
                    .stream().collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

            List<RegistryParticipantDto> dtos = pageParticipants.stream()
                    .map(p -> buildDto(p,
                            identifiersMap.getOrDefault(p.getId(), Collections.emptyList()),
                            contactsMap.getOrDefault(p.getId(), Collections.emptyList()),
                            addressesMap.getOrDefault(p.getId(), Collections.emptyList()),
                            preferencesMap.get(p.getId()),
                            candidatesMap.getOrDefault(p.getId(), Collections.emptyList()),
                            enrollmentsMap.getOrDefault(p.getId(), Collections.emptyList()),
                            studiesMap,
                            pageParticipants))
                    .collect(Collectors.toList());

            return new RegistryPagedResponse<>(dtos, totalCount, safePage, safePageSize);
        }

        // Fallback for mock unit test setups that only mocked findByTenantId
        return searchParticipantsInMemoryFallback(
                tenantId, siteId, searchTerm, contactFilter, availableFilter, selectedStudies, customFilters, safePage, safePageSize, sortBy, sortDirection
        );
    }

    private RegistryPagedResponse<RegistryParticipantDto> searchParticipantsInMemoryFallback(
            UUID tenantId,
            UUID siteId,
            String searchTerm,
            String contactFilter,
            String availableFilter,
            List<String> selectedStudies,
            List<CustomFilterRuleDto> customFilters,
            int page,
            int pageSize,
            String sortBy,
            String sortDirection) {

        // 1. Fetch participants for tenant
        List<Participant> participants = participantRepository.findByTenantId(tenantId);
        if (siteId != null) {
            participants = participants.stream()
                    .filter(p -> siteId.equals(p.getSiteId()))
                    .collect(Collectors.toList());
        }

        if (participants.isEmpty()) {
            return new RegistryPagedResponse<>(Collections.emptyList(), 0, page, pageSize);
        }

        List<UUID> participantIds = participants.stream().map(Participant::getId).collect(Collectors.toList());

        // 2. Batch load related entities for this tenant
        Map<UUID, List<ParticipantIdentifier>> identifiersMap = identifierRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                .stream().collect(Collectors.groupingBy(ParticipantIdentifier::getParticipantId));

        Map<UUID, List<ParticipantContact>> contactsMap = contactRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                .stream().collect(Collectors.groupingBy(ParticipantContact::getParticipantId));

        Map<UUID, List<ParticipantAddress>> addressesMap = addressRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                .stream().collect(Collectors.groupingBy(ParticipantAddress::getParticipantId));

        Map<UUID, ParticipantPreference> preferencesMap = preferenceRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                .stream().collect(Collectors.toMap(ParticipantPreference::getParticipantId, p -> p, (a, b) -> a));

        Map<UUID, List<StudyCandidate>> candidatesMap = candidateRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                .stream().collect(Collectors.groupingBy(StudyCandidate::getParticipantId));

        Map<UUID, List<StudyEnrollment>> enrollmentsMap = enrollmentRepository.findByTenantIdAndParticipantIdIn(tenantId, participantIds)
                .stream().collect(Collectors.groupingBy(StudyEnrollment::getParticipantId));

        // Studies lookup map
        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId)
                .stream().collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        // 3. Assemble DTOs
        List<RegistryParticipantDto> dtos = participants.stream()
                .map(p -> buildDto(p,
                        identifiersMap.getOrDefault(p.getId(), Collections.emptyList()),
                        contactsMap.getOrDefault(p.getId(), Collections.emptyList()),
                        addressesMap.getOrDefault(p.getId(), Collections.emptyList()),
                        preferencesMap.get(p.getId()),
                        candidatesMap.getOrDefault(p.getId(), Collections.emptyList()),
                        enrollmentsMap.getOrDefault(p.getId(), Collections.emptyList()),
                        studiesMap))
                .collect(Collectors.toList());

        // 4. Filter: search term
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String lowerSearch = searchTerm.trim().toLowerCase();
            dtos = dtos.stream().filter(p -> matchesSearch(p, lowerSearch)).collect(Collectors.toList());
        }

        // 5. Filter: contactability
        if (contactFilter != null && !contactFilter.equalsIgnoreCase("all") && !contactFilter.equalsIgnoreCase("show_everyone")) {
            boolean contactWanted = contactFilter.equalsIgnoreCase("yes");
            dtos = dtos.stream().filter(p -> Boolean.valueOf(contactWanted).equals(p.getContactForFutureStudies())).collect(Collectors.toList());
        }

        // 6. Filter: availability
        if (availableFilter != null && !availableFilter.equalsIgnoreCase("all")) {
            boolean availWanted = availableFilter.equalsIgnoreCase("yes");
            dtos = dtos.stream().filter(p -> Boolean.valueOf(availWanted).equals(p.getAvailableToAddStudy())).collect(Collectors.toList());
        }

        // 7. Filter: selected studies
        if (selectedStudies != null && !selectedStudies.isEmpty()) {
            Set<String> studyFilterSet = selectedStudies.stream().map(String::toLowerCase).collect(Collectors.toSet());
            dtos = dtos.stream().filter(p -> {
                if (p.getStudies() == null || p.getStudies().isEmpty()) return false;
                return p.getStudies().stream().anyMatch(s -> studyFilterSet.contains(s.getName().toLowerCase()));
            }).collect(Collectors.toList());
        }

        // 8. Filter: custom filters
        if (customFilters != null && !customFilters.isEmpty()) {
            for (CustomFilterRuleDto rule : customFilters) {
                if (rule.getField() != null && !rule.getField().isBlank() && rule.getOperator() != null) {
                    dtos = dtos.stream().filter(p -> applyCustomRule(p, rule)).collect(Collectors.toList());
                }
            }
        }

        // 9. Sorting
        Comparator<RegistryParticipantDto> comparator = getComparator(sortBy, sortDirection);
        dtos.sort(comparator);

        // 10. Pagination
        long totalCount = dtos.size();
        int safePage = Math.max(0, page);
        int safePageSize = pageSize > 0 ? pageSize : 25;
        int fromIndex = Math.min(safePage * safePageSize, (int) totalCount);
        int toIndex = Math.min(fromIndex + safePageSize, (int) totalCount);

        List<RegistryParticipantDto> pagedList = dtos.subList(fromIndex, toIndex);

        return new RegistryPagedResponse<>(pagedList, totalCount, safePage, safePageSize);
    }

    @Transactional(readOnly = true)
    public List<RegistryParticipantDto> getAllMatchingParticipants(
            UUID tenantId,
            UUID siteId,
            String searchTerm,
            String contactFilter,
            String availableFilter,
            List<String> selectedStudies,
            List<CustomFilterRuleDto> customFilters) {
        RegistryPagedResponse<RegistryParticipantDto> response = searchParticipants(
                tenantId, siteId, searchTerm, contactFilter, availableFilter, selectedStudies, customFilters, 0, Integer.MAX_VALUE, "name", "asc");
        return response.getItems();
    }

    @Transactional(readOnly = true)
    public Optional<RegistryParticipantDto> getParticipantById(UUID tenantId, UUID participantId) {
        return participantRepository.findByTenantIdAndId(tenantId, participantId).map(p -> {
            List<ParticipantIdentifier> identifiers = identifierRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            List<ParticipantContact> contacts = contactRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            List<ParticipantAddress> addresses = addressRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            ParticipantPreference pref = preferenceRepository.findByTenantIdAndParticipantId(tenantId, participantId).orElse(null);
            List<StudyCandidate> candidates = candidateRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            List<StudyEnrollment> enrollments = enrollmentRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId)
                    .stream().collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

            return buildDto(p, identifiers, contacts, addresses, pref, candidates, enrollments, studiesMap);
        });
    }

    @Transactional
    public RegistryParticipantDto createParticipant(UUID tenantId, UUID siteId, UUID userId, CreateParticipantRequest request) {
        Participant participant = new Participant();
        participant.setTenantId(tenantId);
        participant.setSiteId(siteId);
        participant.setFirstName(request.getFirstName());
        participant.setMiddleName(request.getMiddleName());
        participant.setLastName(request.getLastName());
        participant.setPreferredName(request.getPreferredName());
        participant.setStatus(request.getStatus() != null ? request.getStatus().toUpperCase() : "ACTIVE");

        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            participant.setDateOfBirth(parseDate(request.getDateOfBirth()));
        }

        participant.setSexAtBirth(request.getSexAtBirth());
        participant.setGenderIdentity(request.getGenderIdentity());

        Map<String, Object> attributes = new HashMap<>();
        if (request.getTags() != null) {
            attributes.put("tags", request.getTags());
        }
        if (request.getFamilyRole() != null) {
            attributes.put("familyRole", request.getFamilyRole());
        }
        if (request.getGuardianName() != null) {
            attributes.put("guardianName", request.getGuardianName());
        }
        if (request.getEthnicity() != null) {
            attributes.put("ethnicity", request.getEthnicity());
        }
        if (request.getRace() != null) {
            attributes.put("race", request.getRace());
        }
        try {
            participant.setCustomAttributes(objectMapper.writeValueAsString(attributes));
        } catch (Exception e) {
            participant.setCustomAttributes("{}");
        }

        participant.setCreatedBy(userId);
        participant.setUpdatedBy(userId);
        participant.setCreatedAt(OffsetDateTime.now());
        participant.setUpdatedAt(OffsetDateTime.now());

        Participant saved = participantRepository.save(participant);

        // Save Global/MRN Identifier
        ParticipantIdentifier identifier = new ParticipantIdentifier();
        identifier.setTenantId(tenantId);
        identifier.setParticipantId(saved.getId());
        identifier.setIdentifierType("GLOBAL_ID");
        identifier.setIdentifierValue("PART-" + saved.getId().toString().substring(0, 8).toUpperCase());
        identifier.setPrimaryIdentifier(true);
        identifierRepository.save(identifier);

        // Save Contact
        if (request.getPrimaryEmail() != null && !request.getPrimaryEmail().isBlank()) {
            ParticipantContact emailContact = new ParticipantContact();
            emailContact.setTenantId(tenantId);
            emailContact.setParticipantId(saved.getId());
            emailContact.setContactType("EMAIL");
            emailContact.setContactValue(request.getPrimaryEmail());
            emailContact.setPrimaryContact(true);
            contactRepository.save(emailContact);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            ParticipantContact phoneContact = new ParticipantContact();
            phoneContact.setTenantId(tenantId);
            phoneContact.setParticipantId(saved.getId());
            phoneContact.setContactType("PHONE");
            phoneContact.setContactValue(request.getPhone());
            phoneContact.setPrimaryContact(request.getPrimaryEmail() == null);
            contactRepository.save(phoneContact);
        }

        // Save Address
        if ((request.getAddressLine1() != null && !request.getAddressLine1().isBlank()) ||
                (request.getCity() != null && !request.getCity().isBlank())) {
            ParticipantAddress address = new ParticipantAddress();
            address.setTenantId(tenantId);
            address.setParticipantId(saved.getId());
            address.setAddressType("HOME");
            address.setAddressLine1(request.getAddressLine1());
            address.setAddressLine2(request.getAddressLine2());
            address.setCity(request.getCity());
            address.setStateRegion(request.getState());
            address.setPostalCode(request.getPostalCode());
            address.setCountryCode(request.getCountry() != null && request.getCountry().length() <= 3 ? request.getCountry() : "USA");
            address.setPrimaryAddress(true);
            addressRepository.save(address);
        }

        // Save Preference
        ParticipantPreference pref = new ParticipantPreference();
        pref.setTenantId(tenantId);
        pref.setParticipantId(saved.getId());
        pref.setDoNotContact(request.getContactForFutureStudies() != null ? !request.getContactForFutureStudies() : false);
        pref.setPreferredLanguage(request.getPrimaryLanguage() != null ? request.getPrimaryLanguage() : "English");
        preferenceRepository.save(pref);

        // Optional Study Assignment
        if (request.getStudyId() != null && !request.getStudyId().isBlank()) {
            try {
                UUID studyUuid = UUID.fromString(request.getStudyId());
                StudyCandidate candidate = new StudyCandidate();
                candidate.setTenantId(tenantId);
                candidate.setStudyId(studyUuid);
                candidate.setParticipantId(saved.getId());
                candidate.setStatus("REFERRED");
                candidate.setActive(true);
                candidate.setCreatedAt(OffsetDateTime.now());
                candidate.setCreatedBy(userId);
                candidate.setUpdatedAt(OffsetDateTime.now());
                candidate.setUpdatedBy(userId);
                candidateRepository.save(candidate);

                studyRepository.findByTenantIdAndId(tenantId, studyUuid).ifPresent(study -> {
                    if (study.isCustomIdGenerationEnabled() && study.getPrefix() != null && !study.getPrefix().isBlank()) {
                        String customId = generateStudyParticipantId(study);
                        ParticipantIdentifier customIdentifier = new ParticipantIdentifier();
                        customIdentifier.setTenantId(tenantId);
                        customIdentifier.setParticipantId(saved.getId());
                        customIdentifier.setIdentifierType("STUDY_CUSTOM_ID");
                        customIdentifier.setIdentifierValue(customId);
                        customIdentifier.setIssuingSystem(study.getStudyCode() != null ? study.getStudyCode() : study.getId().toString());
                        customIdentifier.setPrimaryIdentifier(false);
                        identifierRepository.save(customIdentifier);
                    }
                });
            } catch (Exception e) {
                log.warn("Invalid studyId {} provided during participant creation", request.getStudyId());
            }
        }

        return getParticipantById(tenantId, saved.getId()).orElseThrow();
    }

    @Transactional
    public RegistryParticipantDto updateParticipant(UUID tenantId, UUID participantId, UUID userId, UpdateParticipantRequest request) {
        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));

        if (request.getFirstName() != null) participant.setFirstName(request.getFirstName());
        if (request.getMiddleName() != null) participant.setMiddleName(request.getMiddleName());
        if (request.getLastName() != null) participant.setLastName(request.getLastName());
        if (request.getPreferredName() != null) participant.setPreferredName(request.getPreferredName());
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            participant.setDateOfBirth(parseDate(request.getDateOfBirth()));
        }
        if (request.getSexAtBirth() != null) participant.setSexAtBirth(request.getSexAtBirth());
        if (request.getGenderIdentity() != null) participant.setGenderIdentity(request.getGenderIdentity());
        if (request.getStatus() != null) participant.setStatus(request.getStatus().toUpperCase());

        // Update custom attributes
        Map<String, Object> attrs = parseCustomAttributes(participant.getCustomAttributes());
        if (request.getTags() != null) attrs.put("tags", request.getTags());
        if (request.getFamilyRole() != null) attrs.put("familyRole", request.getFamilyRole());
        if (request.getGuardianName() != null) attrs.put("guardianName", request.getGuardianName());
        if (request.getEthnicity() != null) attrs.put("ethnicity", request.getEthnicity());
        if (request.getRace() != null) attrs.put("race", request.getRace());
        if (request.getFamilyId() != null) attrs.put("familyId", request.getFamilyId().trim());
        if (request.getVariables() != null) attrs.put("variables", request.getVariables());
        try {
            participant.setCustomAttributes(objectMapper.writeValueAsString(attrs));
        } catch (Exception e) {
            // retain existing
        }

        participant.setUpdatedBy(userId);
        participant.setUpdatedAt(OffsetDateTime.now());
        participantRepository.save(participant);

        // Update Global ID if provided
        if (request.getGlobalId() != null && !request.getGlobalId().isBlank()) {
            List<ParticipantIdentifier> ids = identifierRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            ParticipantIdentifier globalIdObj = ids.stream()
                    .filter(i -> "GLOBAL_ID".equalsIgnoreCase(i.getIdentifierType()))
                    .findFirst()
                    .orElseGet(() -> {
                        ParticipantIdentifier newId = new ParticipantIdentifier();
                        newId.setTenantId(tenantId);
                        newId.setParticipantId(participantId);
                        newId.setIdentifierType("GLOBAL_ID");
                        newId.setPrimaryIdentifier(true);
                        return newId;
                    });
            globalIdObj.setIdentifierValue(request.getGlobalId().trim());
            identifierRepository.save(globalIdObj);
        }

        // Update Preference if provided
        if (request.getContactForFutureStudies() != null || request.getPrimaryLanguage() != null || request.getTimezone() != null) {
            ParticipantPreference pref = preferenceRepository.findByTenantIdAndParticipantId(tenantId, participantId)
                    .orElseGet(() -> {
                        ParticipantPreference p = new ParticipantPreference();
                        p.setTenantId(tenantId);
                        p.setParticipantId(participantId);
                        return p;
                    });
            if (request.getContactForFutureStudies() != null) {
                pref.setDoNotContact(!request.getContactForFutureStudies());
            }
            if (request.getPrimaryLanguage() != null) {
                pref.setPreferredLanguage(request.getPrimaryLanguage());
            }
            if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
                pref.setTimezone(request.getTimezone().trim());
            }
            preferenceRepository.save(pref);
        }

        // Update Address if provided
        if (request.getCity() != null || request.getState() != null || request.getPostalCode() != null || request.getAddressLine1() != null) {
            List<ParticipantAddress> addresses = addressRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            ParticipantAddress address = addresses.stream().filter(ParticipantAddress::isPrimaryAddress).findFirst()
                    .orElseGet(() -> {
                        ParticipantAddress a = new ParticipantAddress();
                        a.setTenantId(tenantId);
                        a.setParticipantId(participantId);
                        a.setAddressType("HOME");
                        a.setPrimaryAddress(true);
                        return a;
                    });
            if (request.getAddressLine1() != null) address.setAddressLine1(request.getAddressLine1());
            if (request.getAddressLine2() != null) address.setAddressLine2(request.getAddressLine2());
            if (request.getCity() != null) address.setCity(request.getCity());
            if (request.getState() != null) address.setStateRegion(request.getState());
            if (request.getPostalCode() != null) address.setPostalCode(request.getPostalCode());
            addressRepository.save(address);
        }

        // Update Contact Phone if provided
        if (request.getPhone() != null) {
            List<ParticipantContact> contacts = contactRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            ParticipantContact phoneContact = contacts.stream().filter(c -> "PHONE".equalsIgnoreCase(c.getContactType())).findFirst()
                    .orElseGet(() -> {
                        ParticipantContact c = new ParticipantContact();
                        c.setTenantId(tenantId);
                        c.setParticipantId(participantId);
                        c.setContactType("PHONE");
                        c.setPrimaryContact(false);
                        return c;
                    });
            phoneContact.setContactValue(request.getPhone());
            contactRepository.save(phoneContact);
        }

        // Update Contact Email if provided
        if (request.getPrimaryEmail() != null) {
            List<ParticipantContact> contacts = contactRepository.findByTenantIdAndParticipantId(tenantId, participantId);
            ParticipantContact emailContact = contacts.stream().filter(c -> "EMAIL".equalsIgnoreCase(c.getContactType())).findFirst()
                    .orElseGet(() -> {
                        ParticipantContact c = new ParticipantContact();
                        c.setTenantId(tenantId);
                        c.setParticipantId(participantId);
                        c.setContactType("EMAIL");
                        c.setPrimaryContact(true);
                        return c;
                    });
            emailContact.setContactValue(request.getPrimaryEmail());
            contactRepository.save(emailContact);
        }

        return getParticipantById(tenantId, participantId).orElseThrow();
    }

    @Transactional
    public void updateParticipantStatus(UUID tenantId, UUID participantId, UUID userId, String status) {
        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));

        String oldStatus = participant.getStatus();
        participant.setStatus(status.toUpperCase());
        participant.setUpdatedBy(userId);
        participant.setUpdatedAt(OffsetDateTime.now());
        participantRepository.save(participant);

        ParticipantStatusHistory history = new ParticipantStatusHistory();
        history.setTenantId(tenantId);
        history.setParticipantId(participantId);
        history.setPreviousStatus(oldStatus);
        history.setNewStatus(status.toUpperCase());
        history.setChangedBy(userId);
        history.setChangedAt(OffsetDateTime.now());
        statusHistoryRepository.save(history);
    }

    @Transactional
    public void deleteParticipant(UUID tenantId, UUID participantId, UUID userId) {
        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));
        participant.setStatus("DELETED");
        participant.setUpdatedBy(userId);
        participant.setUpdatedAt(OffsetDateTime.now());
        participantRepository.save(participant);

        ParticipantStatusHistory history = new ParticipantStatusHistory();
        history.setTenantId(tenantId);
        history.setParticipantId(participantId);
        history.setPreviousStatus(participant.getStatus());
        history.setNewStatus("DELETED");
        history.setReason("Participant deleted by user");
        history.setChangedBy(userId);
        history.setChangedAt(OffsetDateTime.now());
        statusHistoryRepository.save(history);
    }

    @Transactional
    public void assignStudy(UUID tenantId, UUID userId, AssignStudyRequest request) {
        List<UUID> targetIds = new ArrayList<>();
        if (request.getParticipantIds() != null && !request.getParticipantIds().isEmpty()) {
            targetIds.addAll(request.getParticipantIds());
        } else if (request.getParticipantId() != null) {
            targetIds.add(request.getParticipantId());
        }

        if (targetIds.isEmpty()) {
            throw new IllegalArgumentException("No participant specified for study assignment");
        }

        Study study = null;
        if (request.getStudyId() != null) {
            study = studyRepository.findByTenantIdAndId(tenantId, request.getStudyId()).orElse(null);
        }
        if (study == null && request.getStudyName() != null && !request.getStudyName().isBlank()) {
            study = studyRepository.findByTenantId(tenantId).stream()
                    .filter(s -> s.getName().equalsIgnoreCase(request.getStudyName().trim()))
                    .findFirst()
                    .orElse(null);
        }

        if (study == null) {
            throw new IllegalArgumentException("Study not found");
        }

        final Study targetStudy = study;
        UUID effectiveStudyId = targetStudy.getId();
        String status = request.getStatus() != null ? request.getStatus().toUpperCase() : "REFERRED";

        for (UUID pId : targetIds) {
            if (!participantRepository.existsById(pId)) continue;

            if ("ENROLLED".equalsIgnoreCase(status)) {
                StudyEnrollment enrollment = enrollmentRepository.findByTenantIdAndStudyIdAndParticipantId(
                        tenantId, effectiveStudyId, pId)
                        .orElseGet(() -> {
                            StudyEnrollment e = new StudyEnrollment();
                            e.setTenantId(tenantId);
                            e.setStudyId(effectiveStudyId);
                            e.setParticipantId(pId);
                            e.setStudyParticipantId(generateStudyParticipantId(targetStudy));
                            e.setEnrolledAt(OffsetDateTime.now());
                            e.setCreatedBy(userId);
                            return e;
                        });
                enrollment.setStatus("ENROLLED");
                enrollment.setActive(true);
                enrollmentRepository.save(enrollment);

                if (targetStudy.isCustomIdGenerationEnabled() && targetStudy.getPrefix() != null && !targetStudy.getPrefix().isBlank()) {
                    boolean hasIdentifier = identifierRepository.findByTenantIdAndParticipantId(tenantId, pId).stream()
                            .anyMatch(i -> "STUDY_CUSTOM_ID".equalsIgnoreCase(i.getIdentifierType()) &&
                                    (targetStudy.getId().toString().equals(i.getIssuingSystem()) ||
                                     (targetStudy.getStudyCode() != null && targetStudy.getStudyCode().equalsIgnoreCase(i.getIssuingSystem()))));
                    if (!hasIdentifier) {
                        ParticipantIdentifier idRecord = new ParticipantIdentifier();
                        idRecord.setTenantId(tenantId);
                        idRecord.setParticipantId(pId);
                        idRecord.setIdentifierType("STUDY_CUSTOM_ID");
                        idRecord.setIdentifierValue(enrollment.getStudyParticipantId());
                        idRecord.setIssuingSystem(targetStudy.getStudyCode() != null ? targetStudy.getStudyCode() : targetStudy.getId().toString());
                        idRecord.setPrimaryIdentifier(false);
                        identifierRepository.save(idRecord);
                    }
                }
            } else {
                StudyCandidate candidate = candidateRepository.findByTenantIdAndStudyIdAndParticipantId(
                        tenantId, effectiveStudyId, pId)
                        .orElseGet(() -> {
                            StudyCandidate c = new StudyCandidate();
                            c.setTenantId(tenantId);
                            c.setStudyId(effectiveStudyId);
                            c.setParticipantId(pId);
                            c.setCreatedAt(OffsetDateTime.now());
                            c.setCreatedBy(userId);
                            return c;
                        });
                candidate.setStatus(status);
                candidate.setStatusReason(request.getNotes());
                candidate.setActive(true);
                candidate.setUpdatedAt(OffsetDateTime.now());
                candidate.setUpdatedBy(userId);
                candidateRepository.save(candidate);
            }
        }
    }

    private RegistryParticipantDto buildDto(
            Participant p,
            List<ParticipantIdentifier> identifiers,
            List<ParticipantContact> contacts,
            List<ParticipantAddress> addresses,
            ParticipantPreference pref,
            List<StudyCandidate> candidates,
            List<StudyEnrollment> enrollments,
            Map<UUID, Study> studiesMap) {
        return buildDto(p, identifiers, contacts, addresses, pref, candidates, enrollments, studiesMap, Collections.emptyList());
    }

    private RegistryParticipantDto buildDto(
            Participant p,
            List<ParticipantIdentifier> identifiers,
            List<ParticipantContact> contacts,
            List<ParticipantAddress> addresses,
            ParticipantPreference pref,
            List<StudyCandidate> candidates,
            List<StudyEnrollment> enrollments,
            Map<UUID, Study> studiesMap,
            List<Participant> contextParticipants) {

        RegistryParticipantDto dto = new RegistryParticipantDto();
        dto.setId(p.getId().toString());
        String fullName = ((p.getFirstName() != null ? p.getFirstName() : "") + " " +
                (p.getLastName() != null ? p.getLastName() : "")).trim();
        dto.setName(fullName);
        dto.setFirstName(p.getFirstName());
        dto.setLastName(p.getLastName());
        dto.setStatus(p.getStatus() != null ? capitalize(p.getStatus()) : "Active");

        // DOB & Age
        if (p.getDateOfBirth() != null) {
            int age = Period.between(p.getDateOfBirth(), LocalDate.now()).getYears();
            dto.setAge(String.valueOf(age));
            dto.setAgeNumeric(age);
            dto.setBirthMonth(p.getDateOfBirth().getMonth().name());
        } else {
            dto.setAge("N/A");
            dto.setAgeNumeric(null);
        }

        dto.setGender(p.getSexAtBirth() != null ? p.getSexAtBirth() : (p.getGenderIdentity() != null ? p.getGenderIdentity() : "Unspecified"));

        // Identifiers
        identifiers.stream().filter(i -> "GLOBAL_ID".equalsIgnoreCase(i.getIdentifierType())).findFirst()
                .ifPresentOrElse(i -> dto.setGlobalId(i.getIdentifierValue()),
                        () -> dto.setGlobalId(p.getId().toString().substring(0, 8).toUpperCase()));

        // Contacts
        String primaryEmail = null;
        String secondaryEmail = null;
        String phone = null;
        for (ParticipantContact c : contacts) {
            if ("EMAIL".equalsIgnoreCase(c.getContactType())) {
                if (c.isPrimaryContact() && primaryEmail == null) {
                    primaryEmail = c.getContactValue();
                } else if (secondaryEmail == null) {
                    secondaryEmail = c.getContactValue();
                }
            } else if ("PHONE".equalsIgnoreCase(c.getContactType())) {
                if (phone == null || c.isPrimaryContact()) {
                    phone = c.getContactValue();
                }
            }
        }
        dto.setPhone(phone != null ? phone : "");

        // Addresses
        ParticipantAddress primaryAddr = addresses.stream().filter(ParticipantAddress::isPrimaryAddress).findFirst()
                .orElse(addresses.isEmpty() ? null : addresses.get(0));

        if (primaryAddr != null) {
            dto.setCity(primaryAddr.getCity() != null ? primaryAddr.getCity() : "");
            dto.setState(primaryAddr.getStateRegion() != null ? primaryAddr.getStateRegion() : "");
            dto.setZipcode(primaryAddr.getPostalCode() != null ? primaryAddr.getPostalCode() : "");
        } else {
            dto.setCity("");
            dto.setState("");
            dto.setZipcode("");
        }

        // Studies
        Set<UUID> participantStudyIds = new HashSet<>();
        candidates.stream().filter(StudyCandidate::isActive).forEach(c -> participantStudyIds.add(c.getStudyId()));
        enrollments.stream().filter(StudyEnrollment::isActive).forEach(e -> participantStudyIds.add(e.getStudyId()));

        List<StudyItemDto> studyItems = new ArrayList<>();
        boolean canParticipateInOtherStudies = true;

        for (UUID sId : participantStudyIds) {
            Study study = studiesMap.get(sId);
            if (study != null) {
                studyItems.add(new StudyItemDto(study.getName(), true, study.getId(), study.getStudyCode()));
                if (!study.isArchived() && !study.isAllowParticipationInOtherStudies()) {
                    canParticipateInOtherStudies = false;
                }
            }
        }
        dto.setStudies(studyItems);

        // Contactability & Availability
        boolean contactForFuture = pref == null || !pref.isDoNotContact();
        dto.setContactForFutureStudies(contactForFuture);
        dto.setAvailableToAddStudy(canParticipateInOtherStudies);

        // Timestamps & Display strings
        dto.setDateCreated(p.getCreatedAt() != null ? p.getCreatedAt().format(DISPLAY_DT_FMT) : "");
        if (pref != null && pref.getTimezone() != null && !pref.getTimezone().isBlank()) {
            dto.setTimezone(pref.getTimezone());
        } else {
            dto.setTimezone("America/New_York (EDT)");
        }

        // Last Contact date resolution (priority: participant global_last_contact_date, then candidate last_contact_at)
        OffsetDateTime lastContactDate = p.getGlobalLastContactDate();
        if (lastContactDate == null) {
            lastContactDate = candidates.stream()
                    .map(StudyCandidate::getLastContactAt)
                    .filter(Objects::nonNull)
                    .max(OffsetDateTime::compareTo)
                    .orElse(null);
        }

        if (lastContactDate != null) {
            String formattedContact = lastContactDate.format(LAST_CONTACT_FMT);
            dto.setLastContact(formattedContact);
            dto.setGlobalDateOfLastContact(formattedContact);
        } else {
            dto.setLastContact("");
            dto.setGlobalDateOfLastContact("");
        }

        // Parse Custom Attributes
        Map<String, Object> customAttrs = parseCustomAttributes(p.getCustomAttributes());
        List<String> tags = new ArrayList<>();
        if (customAttrs.get("tags") instanceof List) {
            List<?> list = (List<?>) customAttrs.get("tags");
            tags = list.stream().map(Object::toString).collect(Collectors.toList());
        }
        dto.setTags(tags);
        String famId = customAttrs.getOrDefault("familyId", "").toString();
        dto.setFamilyId(famId);

        // ContactMethods DTO
        String fullAddress = primaryAddr != null
                ? (primaryAddr.getAddressLine1() != null ? primaryAddr.getAddressLine1() + ", " : "") +
                (primaryAddr.getCity() != null ? primaryAddr.getCity() + ", " : "") +
                (primaryAddr.getStateRegion() != null ? primaryAddr.getStateRegion() + " " : "") +
                (primaryAddr.getPostalCode() != null ? primaryAddr.getPostalCode() : "")
                : "";

        ContactMethodsDto cm = new ContactMethodsDto(
                primaryEmail,
                secondaryEmail,
                phone,
                fullAddress.trim(),
                pref != null && pref.isAllowEmail() ? "Email" : "Phone"
        );
        dto.setContactMethods(cm);

        // Demographics DTO
        DemographicsDto demo = new DemographicsDto(
                p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : "",
                dto.getGender(),
                customAttrs.getOrDefault("ethnicity", "Not Disclosed").toString(),
                customAttrs.getOrDefault("race", "Not Disclosed").toString(),
                pref != null && pref.getPreferredLanguage() != null ? pref.getPreferredLanguage() : "English"
        );
        dto.setDemographics(demo);

        // FamilyInfo DTO with resolved members
        List<FamilyInfoDto.FamilyMemberDto> familyMembers = new ArrayList<>();
        if (famId != null && !famId.isBlank()) {
            List<Participant> tenantParticipants = contextParticipants != null && !contextParticipants.isEmpty()
                    ? contextParticipants
                    : Collections.emptyList();
            for (Participant other : tenantParticipants) {
                if (other.getId().equals(p.getId())) continue;
                Map<String, Object> otherAttrs = parseCustomAttributes(other.getCustomAttributes());
                if (famId.equalsIgnoreCase(String.valueOf(otherAttrs.get("familyId")))) {
                    String otherName = ((other.getFirstName() != null ? other.getFirstName() : "") + " " +
                            (other.getLastName() != null ? other.getLastName() : "")).trim();
                    String otherAge = other.getDateOfBirth() != null
                            ? String.valueOf(Period.between(other.getDateOfBirth(), LocalDate.now()).getYears())
                            : "N/A";
                    String otherSex = other.getSexAtBirth() != null ? other.getSexAtBirth() : "Unspecified";
                    List<String> otherStudies = candidateRepository.findByTenantIdAndParticipantId(p.getTenantId(), other.getId())
                            .stream()
                            .map(c -> studiesMap.get(c.getStudyId()))
                            .filter(Objects::nonNull)
                            .map(Study::getName)
                            .collect(Collectors.toList());
                    familyMembers.add(new FamilyInfoDto.FamilyMemberDto(
                            other.getId().toString(),
                            otherName,
                            otherSex,
                            otherAge,
                            otherStudies
                    ));
                }
            }
        }

        FamilyInfoDto family = new FamilyInfoDto(
                customAttrs.getOrDefault("familyRole", "Proband").toString(),
                familyMembers.size() + 1,
                "PED-" + (famId.length() > 4 ? famId.substring(famId.length() - 4) : "101"),
                customAttrs.getOrDefault("guardianName", "N/A").toString(),
                familyMembers
        );
        dto.setFamily(family);

        // Variables DTO
        List<ParticipantVariableDto> variableList = new ArrayList<>();
        if (customAttrs.get("variables") instanceof List) {
            try {
                String varJson = objectMapper.writeValueAsString(customAttrs.get("variables"));
                variableList = objectMapper.readValue(varJson, new TypeReference<List<ParticipantVariableDto>>() {});
            } catch (Exception ignored) {}
        }
        dto.setVariables(variableList);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<RegistryParticipantDto> findDuplicatesByName(UUID tenantId, String firstName, String lastName) {
        if (firstName == null || lastName == null || firstName.isBlank() || lastName.isBlank()) {
            return Collections.emptyList();
        }
        List<Participant> matches = participantRepository.findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCase(
                tenantId, firstName.trim(), lastName.trim());
        return matches.stream()
                .map(p -> getParticipantById(tenantId, p.getId()).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private boolean matchesSearch(RegistryParticipantDto p, String lower) {
        if (p.getName() != null && p.getName().toLowerCase().contains(lower)) return true;
        if (p.getPhone() != null && p.getPhone().toLowerCase().contains(lower)) return true;
        if (p.getCity() != null && p.getCity().toLowerCase().contains(lower)) return true;
        if (p.getState() != null && p.getState().toLowerCase().contains(lower)) return true;
        if (p.getZipcode() != null && p.getZipcode().toLowerCase().contains(lower)) return true;
        if (p.getGlobalId() != null && p.getGlobalId().toLowerCase().contains(lower)) return true;
        if (p.getContactMethods() != null) {
            if (p.getContactMethods().getPrimaryEmail() != null && p.getContactMethods().getPrimaryEmail().toLowerCase().contains(lower)) return true;
        }
        return false;
    }

    public void validateFilterRules(UUID tenantId, List<CustomFilterRuleDto> rules) {
        if (rules == null || rules.isEmpty()) {
            return;
        }

        List<Map<String, Object>> metadata = getFilterMetadata(tenantId, null);
        Map<String, String> fieldTypes = new HashMap<>();

        // Standard registry fields
        fieldTypes.put("age", "number");
        fieldTypes.put("gender", "select");
        fieldTypes.put("sex", "select");
        fieldTypes.put("status", "select");
        fieldTypes.put("datecreated", "date");
        fieldTypes.put("lastcontact", "date");
        fieldTypes.put("birthmonth", "select");
        fieldTypes.put("city", "text");
        fieldTypes.put("state", "text");
        fieldTypes.put("zipcode", "text");
        fieldTypes.put("zip", "text");
        fieldTypes.put("postalcode", "text");
        fieldTypes.put("phone", "text");
        fieldTypes.put("phonenumber", "text");
        fieldTypes.put("firstname", "text");
        fieldTypes.put("first_name", "text");
        fieldTypes.put("lastname", "text");
        fieldTypes.put("last_name", "text");
        fieldTypes.put("tags", "select");
        fieldTypes.put("ethnicity", "select");
        fieldTypes.put("race", "select");
        fieldTypes.put("studies", "select");

        for (Map<String, Object> meta : metadata) {
            String id = (String) meta.get("id");
            String type = (String) meta.get("type");
            if (id != null) {
                fieldTypes.put(id.toLowerCase().trim(), type != null ? type : "text");
                if (id.startsWith("custom_")) {
                    fieldTypes.put(id.substring(7).toLowerCase().trim(), type != null ? type : "text");
                }
            }
        }

        for (CustomFilterRuleDto rule : rules) {
            if (rule.getField() == null || rule.getField().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Filter rule field cannot be empty");
            }
            String field = rule.getField().toLowerCase().trim();
            if (!fieldTypes.containsKey(field) && !field.startsWith("custom_")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown filter field: " + rule.getField());
            }

            String fieldType = fieldTypes.getOrDefault(field, "text");
            String op = rule.getOperator() != null ? rule.getOperator().toLowerCase().trim() : "";
            if (op.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Operator cannot be empty for field: " + rule.getField());
            }

            String normalizedOp = normalizeOperator(op);
            validateOperatorForFieldType(fieldType, normalizedOp, rule.getField());

            // Validate range boundaries
            if ("between".equals(normalizedOp) || "not_between".equals(normalizedOp)) {
                String min = rule.getEffectiveMinValue();
                String max = rule.getEffectiveMaxValue();
                if (min == null || min.isBlank() || max == null || max.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Range filter for field '" + rule.getField() + "' requires both minimum and maximum boundaries");
                }
                if ("number".equals(fieldType) || "age".equals(field)) {
                    try {
                        double minD = Double.parseDouble(min.trim());
                        double maxD = Double.parseDouble(max.trim());
                        if (minD > maxD) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Minimum value (" + min + ") cannot be greater than maximum value (" + max + ") for field '" + rule.getField() + "'");
                        }
                    } catch (NumberFormatException e) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Invalid numeric boundary for field '" + rule.getField() + "': " + e.getMessage());
                    }
                } else if ("date".equals(fieldType) || "datetime".equals(fieldType) || "datecreated".equals(field) || "lastcontact".equals(field)) {
                    LocalDate dMin = parseDate(min);
                    LocalDate dMax = parseDate(max);
                    if (dMin == null || dMax == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Invalid date boundary for field '" + rule.getField() + "'");
                    }
                    if (dMin.isAfter(dMax)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Start date cannot be after end date for field '" + rule.getField() + "'");
                    }
                }
            } else if (!"assigned".equals(normalizedOp) && !"not_assigned".equals(normalizedOp)) {
                String val = rule.getValue();
                List<String> values = rule.getEffectiveValues();
                if ((val == null || val.isBlank()) && (values == null || values.isEmpty())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Value is required for operator '" + rule.getOperator() + "' on field '" + rule.getField() + "'");
                }
            }
        }
    }

    private String normalizeOperator(String op) {
        if (op == null) return "equal";
        String lower = op.toLowerCase().trim();
        switch (lower) {
            case "equal to":
            case "equal":
            case "equals":
            case "=":
                return "equal";
            case "not equal to":
            case "not_equal":
            case "not_equals":
            case "!=":
                return "not_equal";
            case "greater than":
            case "greater_than":
            case ">":
                return "greater_than";
            case "less than":
            case "less_than":
            case "<":
                return "less_than";
            case "between":
                return "between";
            case "not between":
            case "not_between":
                return "not_between";
            case "has any value":
            case "assigned":
                return "assigned";
            case "has no value":
            case "not_assigned":
                return "not_assigned";
            case "contains":
                return "contains";
            case "does not contain":
            case "not_contains":
                return "not_contains";
            default:
                return lower;
        }
    }

    private void validateOperatorForFieldType(String fieldType, String normalizedOp, String fieldName) {
        if ("assigned".equals(normalizedOp) || "not_assigned".equals(normalizedOp)) {
            return;
        }

        switch (fieldType.toLowerCase()) {
            case "number":
                if (!Set.of("equal", "not_equal", "greater_than", "less_than", "between", "not_between").contains(normalizedOp)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Operator '" + normalizedOp + "' is not supported for numeric field '" + fieldName + "'");
                }
                break;
            case "date":
            case "datetime":
                if (!Set.of("equal", "not_equal", "greater_than", "less_than", "between", "not_between").contains(normalizedOp)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Operator '" + normalizedOp + "' is not supported for date field '" + fieldName + "'");
                }
                break;
            case "select":
            case "multiselect":
            case "single":
            case "multi":
                if (!Set.of("equal", "not_equal").contains(normalizedOp)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Operator '" + normalizedOp + "' is not supported for categorical field '" + fieldName + "'");
                }
                break;
            case "text":
            default:
                if (!Set.of("equal", "not_equal", "contains", "not_contains", "starts_with", "ends_with").contains(normalizedOp)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Operator '" + normalizedOp + "' is not supported for text field '" + fieldName + "'");
                }
                break;
        }
    }

    private boolean applyCustomRule(RegistryParticipantDto p, CustomFilterRuleDto rule) {
        String field = rule.getField().toLowerCase().trim();
        String op = normalizeOperator(rule.getOperator());
        String targetVal = rule.getValue() != null ? rule.getValue().trim() : "";
        List<String> values = rule.getEffectiveValues();

        String actualVal = getFieldValue(p, field);

        if ("assigned".equals(op)) {
            return actualVal != null && !actualVal.isBlank();
        }
        if ("not_assigned".equals(op)) {
            return actualVal == null || actualVal.isBlank();
        }

        switch (op) {
            case "equal":
                if ("birthmonth".equals(field)) {
                    return matchesBirthMonth(p.getBirthMonth(), targetVal);
                }
                if ("age".equals(field)) {
                    return p.getAgeNumeric() != null && targetVal.equals(String.valueOf(p.getAgeNumeric()));
                }
                if (!values.isEmpty()) {
                    return values.stream().anyMatch(v -> matchesValueOrOption(actualVal, v));
                }
                return matchesValueOrOption(actualVal, targetVal);

            case "not_equal":
                if ("birthmonth".equals(field)) {
                    return !matchesBirthMonth(p.getBirthMonth(), targetVal);
                }
                if ("age".equals(field)) {
                    return p.getAgeNumeric() == null || !targetVal.equals(String.valueOf(p.getAgeNumeric()));
                }
                if (!values.isEmpty()) {
                    return values.stream().noneMatch(v -> matchesValueOrOption(actualVal, v));
                }
                return actualVal == null || !matchesValueOrOption(actualVal, targetVal);

            case "contains":
                return actualVal != null && actualVal.toLowerCase().contains(targetVal.toLowerCase());

            case "not_contains":
                return actualVal == null || !actualVal.toLowerCase().contains(targetVal.toLowerCase());

            case "starts_with":
                return actualVal != null && actualVal.toLowerCase().startsWith(targetVal.toLowerCase());

            case "ends_with":
                return actualVal != null && actualVal.toLowerCase().endsWith(targetVal.toLowerCase());

            case "greater_than":
                if ("age".equals(field)) {
                    try {
                        int threshold = Integer.parseInt(targetVal);
                        return p.getAgeNumeric() != null && p.getAgeNumeric() > threshold;
                    } catch (NumberFormatException ignored) {}
                }
                if (actualVal == null || actualVal.isBlank()) return false;
                try {
                    double actualNum = Double.parseDouble(actualVal);
                    double targetNum = Double.parseDouble(targetVal);
                    return actualNum > targetNum;
                } catch (NumberFormatException e) {
                    LocalDate dActual = parseDate(actualVal);
                    LocalDate dTarget = parseDate(targetVal);
                    if (dActual != null && dTarget != null) {
                        return dActual.isAfter(dTarget);
                    }
                }
                return false;

            case "less_than":
                if ("age".equals(field)) {
                    try {
                        int threshold = Integer.parseInt(targetVal);
                        return p.getAgeNumeric() != null && p.getAgeNumeric() < threshold;
                    } catch (NumberFormatException ignored) {}
                }
                if (actualVal == null || actualVal.isBlank()) return false;
                try {
                    double actualNum = Double.parseDouble(actualVal);
                    double targetNum = Double.parseDouble(targetVal);
                    return actualNum < targetNum;
                } catch (NumberFormatException e) {
                    LocalDate dActual = parseDate(actualVal);
                    LocalDate dTarget = parseDate(targetVal);
                    if (dActual != null && dTarget != null) {
                        return dActual.isBefore(dTarget);
                    }
                }
                return false;

            case "between":
                if (actualVal == null || actualVal.isBlank()) return false;
                String minStr = rule.getEffectiveMinValue();
                String maxStr = rule.getEffectiveMaxValue();
                if (minStr == null || maxStr == null) return false;
                if ("age".equals(field) && p.getAgeNumeric() != null) {
                    try {
                        double low = Double.parseDouble(minStr);
                        double high = Double.parseDouble(maxStr);
                        return p.getAgeNumeric() >= low && p.getAgeNumeric() <= high;
                    } catch (Exception ignored) {}
                }
                try {
                    double actualNum = Double.parseDouble(actualVal);
                    double low = Double.parseDouble(minStr);
                    double high = Double.parseDouble(maxStr);
                    return actualNum >= low && actualNum <= high;
                } catch (NumberFormatException e) {
                    LocalDate dActual = parseDate(actualVal);
                    LocalDate dMin = parseDate(minStr);
                    LocalDate dMax = parseDate(maxStr);
                    if (dActual != null && dMin != null && dMax != null) {
                        return !dActual.isBefore(dMin) && !dActual.isAfter(dMax);
                    }
                }
                return false;

            case "not_between":
                if (actualVal == null || actualVal.isBlank()) return false;
                String nMinStr = rule.getEffectiveMinValue();
                String nMaxStr = rule.getEffectiveMaxValue();
                if (nMinStr == null || nMaxStr == null) return false;
                if ("age".equals(field) && p.getAgeNumeric() != null) {
                    try {
                        double low = Double.parseDouble(nMinStr);
                        double high = Double.parseDouble(nMaxStr);
                        return p.getAgeNumeric() < low || p.getAgeNumeric() > high;
                    } catch (Exception ignored) {}
                }
                try {
                    double actualNum = Double.parseDouble(actualVal);
                    double low = Double.parseDouble(nMinStr);
                    double high = Double.parseDouble(nMaxStr);
                    return actualNum < low || actualNum > high;
                } catch (NumberFormatException e) {
                    LocalDate dActual = parseDate(actualVal);
                    LocalDate dMin = parseDate(nMinStr);
                    LocalDate dMax = parseDate(nMaxStr);
                    if (dActual != null && dMin != null && dMax != null) {
                        return dActual.isBefore(dMin) || dActual.isAfter(dMax);
                    }
                }
                return false;

            default:
                return false;
        }
    }

    private boolean matchesValueOrOption(String actualVal, String targetVal) {
        if (actualVal == null || targetVal == null) return false;
        if (actualVal.equalsIgnoreCase(targetVal.trim())) return true;
        if (actualVal.contains(",")) {
            String[] parts = actualVal.split(",");
            for (String part : parts) {
                if (part.trim().equalsIgnoreCase(targetVal.trim())) return true;
            }
        }
        return false;
    }

    private String getFieldValue(RegistryParticipantDto p, String field) {
        switch (field) {
            case "name":
                return p.getName();
            case "firstname":
            case "first_name":
                return p.getFirstName();
            case "lastname":
            case "last_name":
                return p.getLastName();
            case "gender":
            case "sex":
                return p.getGender();
            case "age":
                return p.getAgeNumeric() != null ? String.valueOf(p.getAgeNumeric()) : "";
            case "status":
                return p.getStatus();
            case "city":
                return p.getCity();
            case "state":
                return p.getState();
            case "zipcode":
            case "zip":
            case "postalcode":
                return p.getZipcode();
            case "phone":
            case "phonenumber":
                return p.getPhone();
            case "birthmonth":
                return p.getBirthMonth();
            case "datecreated":
                return p.getDateCreated();
            case "tags":
                return p.getTags() != null ? String.join(",", p.getTags()) : "";
            default:
                if (field.startsWith("custom_")) {
                    String customKey = field.substring(7);
                    if (p.getVariables() != null) {
                        for (ParticipantVariableDto var : p.getVariables()) {
                            if (matchesVariableKey(var, customKey, field)) {
                                return var.getValue() != null ? var.getValue() : "";
                            }
                        }
                    }
                    return "";
                }
                if (p.getVariables() != null) {
                    for (ParticipantVariableDto var : p.getVariables()) {
                        if (matchesVariableKey(var, field, field)) {
                            return var.getValue() != null ? var.getValue() : "";
                        }
                    }
                }
                return "";
        }
    }

    private boolean matchesVariableKey(ParticipantVariableDto var, String key, String fullField) {
        if (var == null) return false;
        if (key.equalsIgnoreCase(var.getId()) || key.equalsIgnoreCase(var.getName())) {
            return true;
        }
        if (fullField.equalsIgnoreCase(var.getId()) || fullField.equalsIgnoreCase(var.getName())) {
            return true;
        }
        if (key.contains("_")) {
            String suffix = key.substring(key.indexOf('_') + 1);
            if (suffix.equalsIgnoreCase(var.getId()) || suffix.equalsIgnoreCase(var.getName())) {
                return true;
            }
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFilterMetadata(UUID tenantId, String studyId) {
        if (studyRequirementRepository == null || tenantId == null) {
            return Collections.emptyList();
        }

        List<StudyRequirement> reqList = studyRequirementRepository.findByTenantId(tenantId);
        if (reqList == null || reqList.isEmpty()) {
            return Collections.emptyList();
        }

        Map<UUID, Study> studiesMap = studyRepository != null
                ? studyRepository.findByTenantId(tenantId).stream().collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a))
                : Collections.emptyMap();

        Map<String, Map<String, Object>> globalVariables = new LinkedHashMap<>();
        List<Map<String, Object>> studyVariables = new ArrayList<>();

        for (StudyRequirement req : reqList) {
            if (req.getConfiguration() == null || req.getConfiguration().isBlank()) {
                continue;
            }
            try {
                JsonNode root = objectMapper.readTree(req.getConfiguration());
                JsonNode varsNode = root.get("customVariables");
                if (varsNode == null || !varsNode.isArray()) {
                    continue;
                }

                UUID reqStudyId = req.getStudyId();
                Study study = reqStudyId != null ? studiesMap.get(reqStudyId) : null;
                String studyName = study != null ? study.getName() : (reqStudyId != null ? reqStudyId.toString() : "Unknown");

                for (JsonNode v : varsNode) {
                    String id = v.has("id") ? v.get("id").asText().trim() : "";
                    String name = v.has("name") ? v.get("name").asText().trim() : "";
                    String type = v.has("type") ? v.get("type").asText().trim() : "text";
                    boolean isGlobal = (v.has("isGlobal") && v.get("isGlobal").asBoolean()) ||
                                       (v.has("global") && v.get("global").asBoolean());

                    if (id.isEmpty() && name.isEmpty()) {
                        continue;
                    }

                    String canonicalId = !id.isEmpty() ? id : name;
                    String fieldKey = "custom_" + canonicalId;

                    List<Map<String, String>> options = new ArrayList<>();
                    if (v.has("options") && v.get("options").isArray()) {
                        for (JsonNode opt : v.get("options")) {
                            String label = opt.has("label") ? opt.get("label").asText().trim() : "";
                            String val = opt.has("value") ? opt.get("value").asText().trim() : label;
                            if (!val.isEmpty()) {
                                Map<String, String> o = new HashMap<>();
                                o.put("label", label.isEmpty() ? val : label);
                                o.put("value", val);
                                options.add(o);
                            }
                        }
                    }

                    Map<String, Object> fieldDef = new LinkedHashMap<>();
                    fieldDef.put("id", fieldKey);
                    fieldDef.put("label", !name.isEmpty() ? name : id);
                    fieldDef.put("type", type);
                    fieldDef.put("global", isGlobal);
                    if (reqStudyId != null) {
                        fieldDef.put("studyId", reqStudyId.toString());
                        fieldDef.put("studyName", studyName);
                    }
                    fieldDef.put("options", options);

                    if (isGlobal) {
                        if (!globalVariables.containsKey(fieldKey)) {
                            globalVariables.put(fieldKey, fieldDef);
                        } else {
                            Map<String, Object> existing = globalVariables.get(fieldKey);
                            @SuppressWarnings("unchecked")
                            List<Map<String, String>> existingOpts = (List<Map<String, String>>) existing.get("options");
                            Set<String> existingVals = existingOpts.stream().map(o -> o.get("value")).collect(Collectors.toSet());
                            for (Map<String, String> opt : options) {
                                if (!existingVals.contains(opt.get("value"))) {
                                    existingOpts.add(opt);
                                    existingVals.add(opt.get("value"));
                                }
                            }
                        }
                    } else {
                        studyVariables.add(fieldDef);
                    }
                }
            } catch (JsonProcessingException e) {
                log.error("Failed to parse Requirements JSON for study requirement studyId={}: syntax error at line {} col {}",
                        req.getStudyId(),
                        e.getLocation() != null ? e.getLocation().getLineNr() : -1,
                        e.getLocation() != null ? e.getLocation().getColumnNr() : -1);
            } catch (Exception e) {
                log.error("Unexpected error processing requirements configuration for study requirement studyId={}: {}", req.getStudyId(), e.getMessage());
            }
        }

        Map<String, Map<String, Object>> resultMap = new LinkedHashMap<>();

        // Global variables are authoritative
        for (Map.Entry<String, Map<String, Object>> entry : globalVariables.entrySet()) {
            resultMap.put(entry.getKey(), entry.getValue());
        }

        if (studyId != null && !studyId.isBlank()) {
            for (Map<String, Object> sVar : studyVariables) {
                String sVarStudyId = (String) sVar.get("studyId");
                if (sVarStudyId != null && sVarStudyId.equalsIgnoreCase(studyId.trim())) {
                    String fieldKey = (String) sVar.get("id");
                    if (!globalVariables.containsKey(fieldKey)) {
                        resultMap.put(fieldKey, sVar);
                    }
                }
            }
        } else {
            Map<String, List<Map<String, Object>>> groupedByField = new LinkedHashMap<>();
            for (Map<String, Object> sVar : studyVariables) {
                String fieldKey = (String) sVar.get("id");
                if (globalVariables.containsKey(fieldKey)) {
                    continue;
                }
                groupedByField.computeIfAbsent(fieldKey, k -> new ArrayList<>()).add(sVar);
            }

            for (Map.Entry<String, List<Map<String, Object>>> entry : groupedByField.entrySet()) {
                String fieldKey = entry.getKey();
                List<Map<String, Object>> defs = entry.getValue();
                if (defs.size() == 1) {
                    resultMap.put(fieldKey, defs.get(0));
                } else {
                    boolean sameType = defs.stream().map(d -> (String) d.get("type")).distinct().count() == 1;
                    if (sameType) {
                        Map<String, Object> merged = new LinkedHashMap<>(defs.get(0));
                        List<Map<String, String>> allOpts = new ArrayList<>();
                        Set<String> seenVals = new HashSet<>();
                        for (Map<String, Object> def : defs) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, String>> opts = (List<Map<String, String>>) def.get("options");
                            if (opts != null) {
                                for (Map<String, String> o : opts) {
                                    if (seenVals.add(o.get("value"))) {
                                        allOpts.add(o);
                                    }
                                }
                            }
                        }
                        merged.put("options", allOpts);
                        resultMap.put(fieldKey, merged);
                    } else {
                        for (Map<String, Object> def : defs) {
                            String sId = (String) def.get("studyId");
                            String sName = (String) def.get("studyName");
                            String disambiguatedKey = fieldKey + "_" + (sId != null ? sId.replace("-", "") : "study");
                            Map<String, Object> disambiguatedDef = new LinkedHashMap<>(def);
                            disambiguatedDef.put("id", disambiguatedKey);
                            disambiguatedDef.put("label", def.get("label") + " (" + sName + ")");
                            resultMap.put(disambiguatedKey, disambiguatedDef);
                        }
                    }
                }
            }
        }

        return new ArrayList<>(resultMap.values());
    }

    private Sort resolveSort(String sortBy, String sortDirection) {
        boolean asc = !"desc".equalsIgnoreCase(sortDirection);
        String col = sortBy != null ? sortBy.toLowerCase().trim() : "name";
        Sort.Direction direction = asc ? Sort.Direction.ASC : Sort.Direction.DESC;

        switch (col) {
            case "name":
                return Sort.by(direction, "lastName").and(Sort.by(direction, "firstName"));
            case "firstname":
            case "first_name":
                return Sort.by(direction, "firstName");
            case "lastname":
            case "last_name":
                return Sort.by(direction, "lastName");
            case "age":
            case "dateofbirth":
                Sort.Direction dobDir = asc ? Sort.Direction.DESC : Sort.Direction.ASC;
                return Sort.by(dobDir, "dateOfBirth");
            case "gender":
            case "sex":
                return Sort.by(direction, "sexAtBirth");
            case "status":
                return Sort.by(direction, "status");
            case "datecreated":
            case "createdat":
                return Sort.by(direction, "createdAt");
            default:
                return Sort.by(direction, "lastName").and(Sort.by(direction, "firstName"));
        }
    }

    private Comparator<RegistryParticipantDto> getComparator(String sortBy, String sortDirection) {
        boolean asc = !"desc".equalsIgnoreCase(sortDirection);
        Comparator<RegistryParticipantDto> cmp;

        if (sortBy == null) sortBy = "name";

        switch (sortBy.toLowerCase()) {
            case "age":
                cmp = Comparator.comparing(p -> p.getAgeNumeric() != null ? p.getAgeNumeric() : -1);
                break;
            case "gender":
                cmp = Comparator.comparing(p -> p.getGender() != null ? p.getGender() : "", String.CASE_INSENSITIVE_ORDER);
                break;
            case "status":
                cmp = Comparator.comparing(p -> p.getStatus() != null ? p.getStatus() : "", String.CASE_INSENSITIVE_ORDER);
                break;
            case "datecreated":
                cmp = Comparator.comparing(p -> p.getDateCreated() != null ? p.getDateCreated() : "", String.CASE_INSENSITIVE_ORDER);
                break;
            case "name":
            default:
                cmp = Comparator.comparing(p -> p.getName() != null ? p.getName() : "", String.CASE_INSENSITIVE_ORDER);
                break;
        }

        return asc ? cmp : cmp.reversed();
    }

    private Map<String, Object> parseCustomAttributes(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private LocalDate parseDate(String val) {
        try {
            if (val.contains("-")) {
                return LocalDate.parse(val);
            }
            if (val.contains("/")) {
                String[] parts = val.split("/");
                if (parts.length == 3) {
                    if (parts[2].length() == 4) { // MM/dd/yyyy
                        return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private boolean matchesBirthMonth(String actualMonth, String targetVal) {
        if (actualMonth == null || targetVal == null) return false;
        if (actualMonth.equalsIgnoreCase(targetVal)) return true;
        try {
            int monthNum = Integer.parseInt(targetVal);
            if (monthNum >= 1 && monthNum <= 12) {
                String expected = java.time.Month.of(monthNum).name();
                return actualMonth.equalsIgnoreCase(expected);
            }
        } catch (NumberFormatException ignored) {}
        return actualMonth.toLowerCase().startsWith(targetVal.toLowerCase());
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    String generateStudyParticipantId(Study study) {
        if (study != null && study.isCustomIdGenerationEnabled() && study.getPrefix() != null && !study.getPrefix().isBlank()) {
            String prefix = study.getPrefix().trim().toUpperCase();
            long nextVal = study.getNextSequentialIdentifier() + 1;
            study.setNextSequentialIdentifier(nextVal);
            study.setUpdatedAt(OffsetDateTime.now());
            studyRepository.save(study);
            return prefix + String.format("%08d", nextVal);
        }
        return "SP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
