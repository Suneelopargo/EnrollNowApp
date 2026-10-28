package com.enrollnow.participant.services;

import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ParticipantContactLogService {

    private static final Logger log = LoggerFactory.getLogger(ParticipantContactLogService.class);
    private static final DateTimeFormatter DISPLAY_DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a");

    private static final List<String> DEFAULT_CONTACT_TYPES = List.of(
            "Phone Call",
            "Email",
            "Text Message",
            "In Person",
            "Appointment",
            "No Show",
            "Other"
    );

    private final ParticipantContactLogRepository contactLogRepository;
    private final ContactOutcomeRepository outcomeRepository;
    private final ParticipantRepository participantRepository;
    private final ParticipantContactRepository participantContactRepository;
    private final StudyCandidateRepository candidateRepository;
    private final StudyRepository studyRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final UserRepository userRepository;
    private final UserEmailRepository userEmailRepository;
    private final AuditRecorder auditRecorder;
    private final SitePermissionService sitePermissionService;

    public ParticipantContactLogService(
            ParticipantContactLogRepository contactLogRepository,
            ContactOutcomeRepository outcomeRepository,
            ParticipantRepository participantRepository,
            ParticipantContactRepository participantContactRepository,
            StudyCandidateRepository candidateRepository,
            StudyRepository studyRepository,
            StudyMemberRepository studyMemberRepository,
            UserRepository userRepository,
            UserEmailRepository userEmailRepository,
            @Autowired(required = false) AuditRecorder auditRecorder,
            @Autowired(required = false) SitePermissionService sitePermissionService) {
        this.contactLogRepository = contactLogRepository;
        this.outcomeRepository = outcomeRepository;
        this.participantRepository = participantRepository;
        this.participantContactRepository = participantContactRepository;
        this.candidateRepository = candidateRepository;
        this.studyRepository = studyRepository;
        this.studyMemberRepository = studyMemberRepository;
        this.userRepository = userRepository;
        this.userEmailRepository = userEmailRepository;
        this.auditRecorder = auditRecorder;
        this.sitePermissionService = sitePermissionService;
    }

    @Transactional(readOnly = true)
    public List<ParticipantContactLogDto> getContactLogs(
            UUID tenantId,
            UUID participantId,
            UUID studyId,
            UUID callerUserId) {

        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        List<ParticipantContactLog> logs = contactLogRepository
                .findByTenantIdAndParticipantIdOrderByStickyDescDateTimeOfContactDesc(tenantId, participantId);

        if (studyId != null) {
            logs = logs.stream()
                    .filter(l -> l.getStudyId() == null || studyId.equals(l.getStudyId()) || l.isGlobal())
                    .collect(Collectors.toList());
        }

        if (logs.isEmpty()) {
            return Collections.emptyList();
        }

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);

        return logs.stream()
                .map(l -> toDto(l, studiesMap, usersMap, callerUserId, isUserAdminOrManager))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ParticipantContactLogDto getContactLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId) {

        ParticipantContactLog log = contactLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact log not found"));

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);

        return toDto(log, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional(readOnly = true)
    public List<ContactTypeOptionDto> getContactTypes(UUID tenantId, UUID studyId) {
        Set<String> distinctTypes = new LinkedHashSet<>(DEFAULT_CONTACT_TYPES);

        try {
            List<String> recordedTypes = contactLogRepository.findDistinctContactTypes(tenantId, studyId);
            if (recordedTypes != null) {
                for (String t : recordedTypes) {
                    if (t != null && !t.isBlank()) {
                        distinctTypes.add(t.trim());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch recorded contact types: {}", e.getMessage());
        }

        return distinctTypes.stream()
                .map(t -> new ContactTypeOptionDto(t, t))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContactOutcomeDto> getContactOutcomes(UUID tenantId) {
        List<ContactOutcome> outcomes = outcomeRepository.findByTenantIdAndActiveTrueOrderByOutcomeAsc(tenantId);
        return outcomes.stream()
                .map(o -> new ContactOutcomeDto(o.getId(), o.getOutcome(), o.isActive()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContactMethodOptionDto> getParticipantContactMethods(UUID tenantId, UUID participantId, UUID studyId) {
        List<ParticipantContact> contacts = participantContactRepository.findByTenantIdAndParticipantId(tenantId, participantId);
        List<ContactMethodOptionDto> options = new ArrayList<>();

        for (ParticipantContact c : contacts) {
            String val = c.getContactValue();
            if (val == null || val.isBlank()) continue;

            String type = c.getContactType() != null ? c.getContactType() : "Contact";
            String label = val + " (" + type + ")";
            options.add(new ContactMethodOptionDto(label, val, c.isPrimaryContact()));
        }

        // Sort so preferred / primary contact methods appear first
        options.sort((a, b) -> Boolean.compare(b.isPreferred(), a.isPreferred()));
        return options;
    }

    @Transactional(readOnly = true)
    public List<ContactTeamMemberDto> getContactTeamMembers(UUID tenantId, UUID studyId) {
        List<User> users;
        if (studyId != null) {
            List<StudyMember> members = studyMemberRepository.findByTenantIdAndIdStudyId(tenantId, studyId);
            Set<UUID> memberUserIds = members.stream()
                    .filter(StudyMember::isActive)
                    .map(m -> m.getId().getUserId())
                    .collect(Collectors.toSet());

            users = userRepository.findByTenantId(tenantId).stream()
                    .filter(u -> memberUserIds.contains(u.getId()))
                    .collect(Collectors.toList());

            if (users.isEmpty()) {
                users = userRepository.findByTenantIdAndStatus(tenantId, "ACTIVE");
            }
        } else {
            users = userRepository.findByTenantIdAndStatus(tenantId, "ACTIVE");
        }

        Map<UUID, UserEmail> primaryEmails = userEmailRepository.findByTenantIdAndPrimaryEmailTrue(tenantId).stream()
                .collect(Collectors.toMap(UserEmail::getUserId, e -> e, (a, b) -> a));

        return users.stream()
                .map(u -> {
                    String fullName = (u.getFirstName() + " " + u.getLastName()).trim();
                    UserEmail emailObj = primaryEmails.get(u.getId());
                    String email = emailObj != null ? emailObj.getEmail() : "";
                    return new ContactTeamMemberDto(u.getId(), fullName, email);
                })
                .sorted(Comparator.comparing(ContactTeamMemberDto::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    @Transactional
    public ParticipantContactLogDto createContactLog(
            UUID tenantId,
            UUID participantId,
            UUID callerUserId,
            CreateContactLogRequest request) {

        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        UUID studyId = request.getStudyId();
        if (studyId == null && request.getStudyIdentifier() != null && !request.getStudyIdentifier().isBlank()) {
            studyId = studyRepository.findByTenantIdAndNameIgnoreCase(tenantId, request.getStudyIdentifier().trim())
                    .or(() -> studyRepository.findByTenantIdAndStudyCode(tenantId, request.getStudyIdentifier().trim()))
                    .map(Study::getId)
                    .orElse(null);
        }

        if (studyId != null) {
            studyRepository.findByTenantIdAndId(tenantId, studyId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Study not found in current tenant"));
        }

        User contactedByUser = userRepository.findByTenantIdAndId(tenantId, request.getContactedBy())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contacted By user does not exist in current tenant"));

        // If custom outcome was provided, ensure it exists in contact_outcomes
        recordOutcomeIfNew(tenantId, request.getOutcome(), callerUserId);

        ParticipantContactLog logEntity = new ParticipantContactLog();
        logEntity.setTenantId(tenantId);
        logEntity.setParticipantId(participantId);
        logEntity.setStudyId(studyId);
        logEntity.setDateTimeOfContact(request.getDateTimeOfContact() != null ? request.getDateTimeOfContact() : OffsetDateTime.now());
        logEntity.setContactType(request.getContactType().trim());
        logEntity.setContactMethod(request.getContactMethod() != null ? request.getContactMethod().trim() : null);
        logEntity.setContactedByUserId(contactedByUser.getId());
        logEntity.setSpokeTo(request.getSpokeTo() != null ? request.getSpokeTo().trim() : null);
        logEntity.setRegarding(request.getRegarding() != null ? request.getRegarding().trim() : null);
        logEntity.setOutcome(request.getOutcome().trim());
        logEntity.setComments(request.getComments() != null ? request.getComments().trim() : null);
        logEntity.setSticky(Boolean.TRUE.equals(request.getSticky()));
        logEntity.setNotify(Boolean.TRUE.equals(request.getNotify()));
        logEntity.setGlobal(request.getStudyId() == null || Boolean.TRUE.equals(request.getGlobal()));
        logEntity.setLastContact(Boolean.TRUE.equals(request.getLastContact()));
        logEntity.setCreatedBy(callerUserId);
        logEntity.setUpdatedBy(callerUserId);
        logEntity.setCreatedAt(OffsetDateTime.now());
        logEntity.setUpdatedAt(OffsetDateTime.now());

        ParticipantContactLog savedLog = contactLogRepository.save(logEntity);

        // Update Last Contact semantics
        if (savedLog.isLastContact()) {
            applyLastContactUpdate(tenantId, participant, savedLog.getStudyId(), savedLog.getDateTimeOfContact());
        }

        // Record Audit Event
        recordAuditEvent(
                tenantId,
                callerUserId,
                savedLog.getId(),
                "CREATE",
                "Created contact log for participant " + participantId + " (Type: " + savedLog.getContactType() + ")"
        );

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        return toDto(savedLog, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional
    public ParticipantContactLogDto updateContactLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId,
            UpdateContactLogRequest request) {

        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        ParticipantContactLog existing = contactLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact log not found"));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        if (!callerUserId.equals(existing.getCreatedBy()) && !isUserAdminOrManager) {
            throw new AccessDeniedException("Access denied: only the author or an administrator can edit this contact log");
        }

        boolean wasLastContact = existing.isLastContact();

        if (request.getDateTimeOfContact() != null) existing.setDateTimeOfContact(request.getDateTimeOfContact());
        if (request.getContactType() != null && !request.getContactType().isBlank()) existing.setContactType(request.getContactType().trim());
        if (request.getContactMethod() != null) existing.setContactMethod(request.getContactMethod().trim());
        if (request.getContactedBy() != null) {
            userRepository.findByTenantIdAndId(tenantId, request.getContactedBy())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contacted By user not found in tenant"));
            existing.setContactedByUserId(request.getContactedBy());
        }
        if (request.getSpokeTo() != null) existing.setSpokeTo(request.getSpokeTo().trim());
        if (request.getRegarding() != null) existing.setRegarding(request.getRegarding().trim());
        if (request.getOutcome() != null && !request.getOutcome().isBlank()) {
            recordOutcomeIfNew(tenantId, request.getOutcome(), callerUserId);
            existing.setOutcome(request.getOutcome().trim());
        }
        if (request.getComments() != null) existing.setComments(request.getComments().trim());
        if (request.getSticky() != null) existing.setSticky(request.getSticky());
        if (request.getNotify() != null) existing.setNotify(request.getNotify());
        if (request.getGlobal() != null) existing.setGlobal(request.getGlobal());
        if (request.getLastContact() != null) existing.setLastContact(request.getLastContact());

        existing.setUpdatedBy(callerUserId);
        existing.setUpdatedAt(OffsetDateTime.now());

        ParticipantContactLog updatedLog = contactLogRepository.save(existing);

        if (!wasLastContact && updatedLog.isLastContact()) {
            applyLastContactUpdate(tenantId, participant, updatedLog.getStudyId(), updatedLog.getDateTimeOfContact());
        }

        recordAuditEvent(
                tenantId,
                callerUserId,
                updatedLog.getId(),
                "UPDATE",
                "Updated contact log for participant " + participantId
        );

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return toDto(updatedLog, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional
    public ParticipantContactLogDto pinContactLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId,
            boolean sticky) {

        ParticipantContactLog existing = contactLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact log not found"));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        if (!callerUserId.equals(existing.getCreatedBy()) && !isUserAdminOrManager) {
            throw new AccessDeniedException("Access denied: only the author or an administrator can pin this contact log");
        }

        existing.setSticky(sticky);
        existing.setUpdatedBy(callerUserId);
        existing.setUpdatedAt(OffsetDateTime.now());

        ParticipantContactLog saved = contactLogRepository.save(existing);

        recordAuditEvent(
                tenantId,
                callerUserId,
                saved.getId(),
                sticky ? "PIN" : "UNPIN",
                (sticky ? "Pinned" : "Unpinned") + " contact log for participant " + participantId
        );

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return toDto(saved, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional
    public void deleteContactLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId) {

        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        ParticipantContactLog existing = contactLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact log not found"));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        if (!callerUserId.equals(existing.getCreatedBy()) && !isUserAdminOrManager) {
            throw new AccessDeniedException("Access denied: only the author or an administrator can delete this contact log");
        }

        boolean wasLastContact = existing.isLastContact();
        contactLogRepository.delete(existing);

        if (wasLastContact) {
            recalculateLastContactAfterDeletion(tenantId, participant);
        }

        recordAuditEvent(
                tenantId,
                callerUserId,
                existing.getId(),
                "DELETE",
                "Deleted contact log " + logId + " for participant " + participantId
        );
    }

    private void applyLastContactUpdate(UUID tenantId, Participant participant, UUID studyId, OffsetDateTime contactDate) {
        if (contactDate == null) return;

        if (studyId != null) {
            // Update study candidate if present
            candidateRepository.findByTenantIdAndParticipantId(tenantId, participant.getId()).stream()
                    .filter(c -> studyId.equals(c.getStudyId()))
                    .findFirst()
                    .ifPresent(c -> {
                        if (c.getLastContactAt() == null || contactDate.isAfter(c.getLastContactAt())) {
                            c.setLastContactAt(contactDate);
                            candidateRepository.save(c);
                        }
                    });

            // Recalculate global last contact date: max across studies and contactDate
            OffsetDateTime maxFromStudies = candidateRepository.findByTenantIdAndParticipantId(tenantId, participant.getId()).stream()
                    .map(StudyCandidate::getLastContactAt)
                    .filter(Objects::nonNull)
                    .max(OffsetDateTime::compareTo)
                    .orElse(contactDate);

            OffsetDateTime newGlobal = maxFromStudies.isAfter(contactDate) ? maxFromStudies : contactDate;
            if (participant.getGlobalLastContactDate() == null || newGlobal.isAfter(participant.getGlobalLastContactDate())) {
                participant.setGlobalLastContactDate(newGlobal);
                participantRepository.save(participant);
            }
        } else {
            // Registry global contact: directly sets global date
            participant.setGlobalLastContactDate(contactDate);
            participantRepository.save(participant);
        }
    }

    private void recalculateLastContactAfterDeletion(UUID tenantId, Participant participant) {
        // Find latest contact log marked as lastContact
        List<ParticipantContactLog> remaining = contactLogRepository
                .findByTenantIdAndParticipantIdOrderByStickyDescDateTimeOfContactDesc(tenantId, participant.getId());

        OffsetDateTime latestMarked = remaining.stream()
                .filter(ParticipantContactLog::isLastContact)
                .map(ParticipantContactLog::getDateTimeOfContact)
                .max(OffsetDateTime::compareTo)
                .orElse(null);

        if (latestMarked != null) {
            participant.setGlobalLastContactDate(latestMarked);
        } else {
            // Fall back to max candidate lastContactAt
            OffsetDateTime maxCandidate = candidateRepository.findByTenantIdAndParticipantId(tenantId, participant.getId()).stream()
                    .map(StudyCandidate::getLastContactAt)
                    .filter(Objects::nonNull)
                    .max(OffsetDateTime::compareTo)
                    .orElse(null);

            participant.setGlobalLastContactDate(maxCandidate);
        }
        participantRepository.save(participant);
    }

    private void recordOutcomeIfNew(UUID tenantId, String outcome, UUID userId) {
        if (outcome == null || outcome.isBlank()) return;
        String trimmed = outcome.trim();
        if (!outcomeRepository.existsByTenantIdAndOutcomeIgnoreCase(tenantId, trimmed)) {
            ContactOutcome newOutcome = new ContactOutcome(tenantId, trimmed, userId);
            try {
                outcomeRepository.save(newOutcome);
            } catch (Exception e) {
                // Ignore unique constraint violation if inserted concurrently
            }
        }
    }

    private void recordAuditEvent(UUID tenantId, UUID actorUserId, UUID entityId, String action, String description) {
        if (auditRecorder == null) return;
        try {
            auditRecorder.record(new AuditEventCommand(
                    tenantId,
                    actorUserId,
                    "PARTICIPANT_CONTACT_LOG",
                    entityId,
                    action,
                    description,
                    "APPLICATION",
                    null,
                    null,
                    null,
                    null,
                    null
            ));
        } catch (Exception e) {
            log.warn("Failed to record audit event: {}", e.getMessage());
        }
    }

    private boolean checkUserIsAdminOrManager(UUID tenantId, UUID userId) {
        if (sitePermissionService == null) return false;
        try {
            UserEffectivePermissionsResponse effective = sitePermissionService.resolveEffectivePermissions(tenantId, userId, null);
            return effective.isCanAccessSiteAdmin()
                    || effective.isCanManageSiteAdmins()
                    || effective.getRoles().contains("SITE_ADMIN")
                    || effective.getRoles().contains("SITE_MANAGER");
        } catch (Exception e) {
            return false;
        }
    }

    private ParticipantContactLogDto toDto(
            ParticipantContactLog logEntity,
            Map<UUID, Study> studiesMap,
            Map<UUID, User> usersMap,
            UUID callerUserId,
            boolean isUserAdminOrManager) {

        ParticipantContactLogDto dto = new ParticipantContactLogDto();
        dto.setId(logEntity.getId());
        dto.setTenantId(logEntity.getTenantId());
        dto.setParticipantId(logEntity.getParticipantId());
        dto.setStudyId(logEntity.getStudyId());

        if (logEntity.getStudyId() != null) {
            Study s = studiesMap.get(logEntity.getStudyId());
            dto.setStudyName(s != null ? s.getName() : "Unknown Study");
        } else {
            dto.setStudyName("Registry");
        }

        dto.setDateTimeOfContact(logEntity.getDateTimeOfContact());
        if (logEntity.getDateTimeOfContact() != null) {
            dto.setFormattedDateTime(logEntity.getDateTimeOfContact().format(DISPLAY_DT_FMT));
        }

        dto.setContactType(logEntity.getContactType());
        dto.setContactMethod(logEntity.getContactMethod());
        dto.setContactedBy(logEntity.getContactedByUserId());

        User contactedByUser = usersMap.get(logEntity.getContactedByUserId());
        if (contactedByUser != null) {
            dto.setContactedByName((contactedByUser.getFirstName() + " " + contactedByUser.getLastName()).trim());
        } else {
            dto.setContactedByName("User (" + logEntity.getContactedByUserId() + ")");
        }

        dto.setSpokeTo(logEntity.getSpokeTo());
        dto.setRegarding(logEntity.getRegarding());
        dto.setOutcome(logEntity.getOutcome());
        dto.setComments(logEntity.getComments());
        dto.setSticky(logEntity.isSticky());
        dto.setNotify(logEntity.isNotify());
        dto.setGlobal(logEntity.isGlobal());
        dto.setLastContact(logEntity.isLastContact());

        dto.setCreatedAt(logEntity.getCreatedAt());
        dto.setCreatedBy(logEntity.getCreatedBy());
        User createdByUser = usersMap.get(logEntity.getCreatedBy());
        if (createdByUser != null) {
            dto.setCreatedByName((createdByUser.getFirstName() + " " + createdByUser.getLastName()).trim());
            dto.setCreatedByInitials(getInitials(createdByUser.getFirstName(), createdByUser.getLastName()));
        }

        dto.setUpdatedAt(logEntity.getUpdatedAt());
        dto.setUpdatedBy(logEntity.getUpdatedBy());
        User updatedByUser = usersMap.get(logEntity.getUpdatedBy());
        if (updatedByUser != null) {
            dto.setUpdatedByName((updatedByUser.getFirstName() + " " + updatedByUser.getLastName()).trim());
            dto.setUpdatedByInitials(getInitials(updatedByUser.getFirstName(), updatedByUser.getLastName()));
        }

        boolean isAuthor = callerUserId != null && callerUserId.equals(logEntity.getCreatedBy());
        dto.setEditable(isAuthor || isUserAdminOrManager);
        dto.setPinnable(isAuthor || isUserAdminOrManager);

        return dto;
    }

    private String getInitials(String first, String last) {
        String f = (first != null && !first.isBlank()) ? first.substring(0, 1).toUpperCase() : "";
        String l = (last != null && !last.isBlank()) ? last.substring(0, 1).toUpperCase() : "";
        return f + l;
    }
}
