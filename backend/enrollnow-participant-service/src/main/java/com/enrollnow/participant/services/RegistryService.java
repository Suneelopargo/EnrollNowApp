package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.exceptions.RegistryDuplicateException;
import com.enrollnow.participant.exceptions.RegistryParticipantNotFoundException;
import com.enrollnow.participant.exceptions.RegistrySavedSearchNotFoundException;
import com.enrollnow.participant.models.ParticipantLog;
import com.enrollnow.participant.models.RegistryParticipant;
import com.enrollnow.participant.models.SavedRegistrySearch;
import com.enrollnow.participant.models.StudyInfo;
import com.enrollnow.participant.models.SurveySubmission;
import com.enrollnow.participant.repositories.RegistryParticipantRepository;
import com.enrollnow.participant.repositories.RegistrySavedSearchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class RegistryService {
    private final RegistryParticipantRepository participantRepository;
    private final RegistrySavedSearchRepository savedSearchRepository;
    private final RegistrySearchService searchService;
    private final RegistryMapper mapper;

    public RegistryService(RegistryParticipantRepository participantRepository,
                           RegistrySavedSearchRepository savedSearchRepository,
                           RegistrySearchService searchService,
                           RegistryMapper mapper) {
        this.participantRepository = participantRepository;
        this.savedSearchRepository = savedSearchRepository;
        this.searchService = searchService;
        this.mapper = mapper;
    }

    public RegistryFilterOptionsResponse getFilterOptions(UUID tenantId) {
        List<RegistryParticipant> participants = participantRepository.findAllByTenantId(tenantId);
        RegistryFilterOptionsResponse response = new RegistryFilterOptionsResponse();
        response.setTags(sortedDistinct(participants.stream().flatMap(p -> p.getTags().stream()).toList()));
        response.setStates(sortedDistinct(participants.stream().map(RegistryParticipant::getState).toList()));
        response.setCities(sortedDistinct(participants.stream().map(RegistryParticipant::getCity).toList()));
        response.setZipcodes(sortedDistinct(participants.stream().map(RegistryParticipant::getZipcode).toList()));
        response.setGenders(sortedDistinct(participants.stream().map(RegistryParticipant::getSex).toList()));
        response.setRaces(sortedDistinct(participants.stream().map(RegistryParticipant::getRace).toList()));
        response.setEthnicities(sortedDistinct(participants.stream().map(RegistryParticipant::getEthnicity).toList()));

        List<RegistryFilterOptionsResponse.StudyOption> studies = participants.stream()
                .flatMap(p -> p.getStudies().stream())
                .filter(s -> s.getStudyId() != null)
                .map(s -> new RegistryFilterOptionsResponse.StudyOption(s.getStudyId().toString(), s.getStudyName()))
                .collect(java.util.stream.Collectors.toMap(
                        RegistryFilterOptionsResponse.StudyOption::getId,
                        s -> s,
                        (a, b) -> a,
                        java.util.LinkedHashMap::new))
                .values().stream().sorted(Comparator.comparing(RegistryFilterOptionsResponse.StudyOption::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))).toList();
        response.setStudies(studies);

        List<RegistryFilterOptionsResponse.StatusOption> statuses = participants.stream()
                .flatMap(p -> p.getStudies().stream())
                .filter(s -> s.getStatusId() != null)
                .map(s -> new RegistryFilterOptionsResponse.StatusOption(s.getStatusId().toString(), s.getStatusName(),
                        s.getStudyId() == null ? null : s.getStudyId().toString()))
                .collect(java.util.stream.Collectors.toMap(
                        s -> s.getId() + ":" + s.getStudyId(), s -> s, (a, b) -> a, java.util.LinkedHashMap::new))
                .values().stream().sorted(Comparator.comparing(RegistryFilterOptionsResponse.StatusOption::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))).toList();
        response.setStatuses(statuses);

        response.setCustomVariables(List.of());
        return response;
    }

    public RegistryParticipantResponse getParticipant(UUID tenantId, UUID participantId) {
        RegistryParticipant participant = findParticipant(tenantId, participantId);
        RegistryParticipantResponse response = mapper.toResponse(participant);
        response.setAvailableToAddStudy(searchService.isParticipantAvailable(participant));
        return response;
    }

    public ParticipantLogsResponse getParticipantLogs(UUID tenantId, UUID participantId, String type) {
        RegistryParticipant p = findParticipant(tenantId, participantId);
        String normalized = normalizeLogType(type);
        List<ParticipantLog> logs = switch (normalized) {
            case "contactLog" -> p.getContactLogs();
            case "textLog" -> p.getTextLogs();
            case "emailLog" -> p.getEmailLogs();
            case "consentLog" -> p.getConsentLogs();
            default -> throw new IllegalArgumentException("Unsupported log type: " + type);
        };
        ParticipantLogsResponse response = new ParticipantLogsResponse();
        response.setGlobalLastContactDate(p.getGlobalLastContactDate());
        response.setLogType(normalized);
        response.setLogs(logs.stream().map(mapper::toLogResponse).toList());
        return response;
    }

    public List<SurveySubmissionResponse> getSurveySubmissions(UUID tenantId, UUID participantId) {
        RegistryParticipant p = findParticipant(tenantId, participantId);
        return p.getSurveySubmissions().stream().map(mapper::toSurveyResponse).toList();
    }

    @Transactional
    public RegistryParticipantResponse createParticipant(UUID tenantId, UUID userId, CreateRegistryParticipantRequest request) {
        String first = request.getFirstName().trim();
        String last = request.getLastName().trim();
        String globalId = request.getGlobalId();
        if (globalId == null || globalId.isBlank()) {
            globalId = randomGlobalId();
        }

        RegistryParticipant participant = new RegistryParticipant();
        participant.setId(UUID.randomUUID());
        participant.setTenantId(tenantId);
        participant.setGlobalId(globalId);
        participant.setFirstName(first);
        participant.setMiddleName(trimToNull(request.getMiddleName()));
        participant.setLastName(last);
        participant.setInsertedAt(OffsetDateTime.now(ZoneOffset.UTC));
        participant.setInsertedBy(userId);
        participant.setStudies(new ArrayList<>());
        participant.setContactForFutureStudies(false);

        // Mirrors Ripple addRegistryParticipant: creation source is registry and a self-contact/HIPAA event is created.
        participant.getContactLogs().add(new ParticipantLog(
                UUID.randomUUID().toString(), "contact", "Self contact created", userId.toString(),
                "Current User", OffsetDateTime.now(ZoneOffset.UTC), "CREATED", null));

        participantRepository.save(participant);
        return getParticipant(tenantId, participant.getId());
    }

    @Transactional
    public RegistryParticipantResponse updateParticipant(UUID tenantId, UUID participantId,
                                                         UpdateRegistryParticipantRequest request) {
        RegistryParticipant p = findParticipant(tenantId, participantId);
        if (request.getGlobalId() != null && !request.getGlobalId().isBlank()) {
            participantRepository.findByTenantIdAndGlobalId(tenantId, request.getGlobalId().trim())
                    .filter(existing -> !existing.getId().equals(participantId))
                    .ifPresent(existing -> { throw new RegistryDuplicateException("Global ID already exists"); });
            p.setGlobalId(request.getGlobalId().trim());
        }
        p.setFirstName(request.getFirstName().trim());
        p.setMiddleName(trimToNull(request.getMiddleName()));
        p.setLastName(request.getLastName().trim());
        p.setSex(trimToNull(request.getSex()));
        p.setBirthday(request.getBirthday());
        p.setEthnicity(trimToNull(request.getEthnicity()));
        p.setRace(trimToNull(request.getRace()));
        p.setFamilyId(trimToNull(request.getFamilyId()));
        p.setTimezone(trimToNull(request.getTimezone()));
        if (request.getContactForFutureStudies() != null) p.setContactForFutureStudies(request.getContactForFutureStudies());
        if (request.getTags() != null) p.setTags(new ArrayList<>(new LinkedHashSet<>(request.getTags())));
        p.setCity(trimToNull(request.getCity()));
        p.setState(trimToNull(request.getState()));
        p.setZipcode(trimToNull(request.getZipcode()));
        if (request.getPhone() != null) p.setPhones(List.of(request.getPhone().trim()));

        participantRepository.save(p);
        return getParticipant(tenantId, participantId);
    }

    @Transactional
    public void deleteParticipant(UUID tenantId, UUID participantId) {
        RegistryParticipant p = findParticipant(tenantId, participantId);
        // Phase 8A uses soft deletion. Final implementation must reproduce Ripple's cascade deletion
        // across survey submissions and participant-related collections once the real schema is available.
        p.setDeleted(true);
        participantRepository.delete(p);
    }

    @Transactional
    public RegistryParticipantResponse addParticipantToStudy(UUID tenantId, UUID participantId, AddParticipantToStudyRequest request) {
        RegistryParticipant p = findParticipant(tenantId, participantId);
        boolean exists = p.getStudies().stream().anyMatch(s -> request.getStudyId().equals(s.getStudyId()));
        if (!exists) {
            StudyInfo info = new StudyInfo(
                    request.getStudyId(),
                    "Study " + request.getStudyId().toString().substring(0, 8),
                    request.getStatusId(),
                    request.getStatusName() == null ? "Active" : request.getStatusName(),
                    false,
                    false,
                    true);
            p.getStudies().add(info);
            participantRepository.save(p);
        }
        return getParticipant(tenantId, participantId);
    }

    public List<SavedRegistrySearchResponse> getSavedSearches(UUID tenantId, UUID userId) {
        return savedSearchRepository.findByTenantIdAndOwnerUserId(tenantId, userId)
                .stream().map(mapper::toSavedSearchResponse).toList();
    }

    @Transactional
    public SavedRegistrySearchResponse saveSearch(UUID tenantId, UUID userId, SavedRegistrySearchRequest request) {
        SavedRegistrySearch search = new SavedRegistrySearch();
        search.setId(UUID.randomUUID());
        search.setTenantId(tenantId);
        search.setOwnerUserId(userId);
        search.setName(request.getName().trim());
        search.setSearch(request.getSearch() == null ? new RegistrySearchRequest() : request.getSearch());
        search.setInsertedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return mapper.toSavedSearchResponse(savedSearchRepository.save(search));
    }

    @Transactional
    public void deleteSavedSearch(UUID tenantId, UUID userId, UUID id) {
        SavedRegistrySearch search = savedSearchRepository.findByTenantIdAndOwnerUserIdAndId(tenantId, userId, id)
                .orElseThrow(() -> new RegistrySavedSearchNotFoundException(id));
        savedSearchRepository.delete(search);
    }

    public RegistryExportResponse export(UUID tenantId, RegistryExportRequest request) {
        RegistrySearchRequest search = request.getSearch() == null ? new RegistrySearchRequest() : request.getSearch();
        RegistrySearchResponse results = searchService.search(tenantId, search);
        // Phase 8A deliberately returns an export job contract instead of generating a file.
        // The old application eventually calls /v1/export and retrieves data from the registry query.
        return new RegistryExportResponse("READY", results.getTotalElements(),
                "Registry export API contract is ready. File generation will be connected after the final database/export service is available.");
    }

    public RegistryParticipantResponse findParticipantResponse(UUID tenantId, UUID participantId) {
        return getParticipant(tenantId, participantId);
    }

    private RegistryParticipant findParticipant(UUID tenantId, UUID participantId) {
        return participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new RegistryParticipantNotFoundException(participantId));
    }

    private String normalizeLogType(String type) {
        if (type == null) throw new IllegalArgumentException("Log type is required");
        return switch (type.trim().toLowerCase(Locale.ROOT)) {
            case "contact", "contactlog" -> "contactLog";
            case "text", "textlog", "sms" -> "textLog";
            case "email", "emaillog" -> "emailLog";
            case "consent", "consentlog" -> "consentLog";
            default -> throw new IllegalArgumentException("Unsupported log type: " + type);
        };
    }

    private List<String> sortedDistinct(List<String> values) {
        return values.stream().filter(v -> v != null && !v.isBlank()).map(String::trim)
                .distinct().sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }

    private String randomGlobalId() {
        return Character.toString((char) ('a' + (int) (Math.random() * 26))) + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private String trimToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
