package com.enrollnow.participant.services;

import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.Participant;
import com.enrollnow.participant.models.ParticipantConsentLog;
import com.enrollnow.participant.models.StudyCandidate;
import com.enrollnow.participant.repositories.ParticipantConsentLogRepository;
import com.enrollnow.participant.repositories.ParticipantRepository;
import com.enrollnow.participant.repositories.StudyCandidateRepository;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ParticipantConsentLogService {

    private static final Logger log = LoggerFactory.getLogger(ParticipantConsentLogService.class);
    private static final DateTimeFormatter DISPLAY_DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a");
    private static final DateTimeFormatter DISPLAY_DATE_ONLY_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy");

    public static final long MAX_CONSENT_SIZE_BYTES = 5L * 1024L * 1024L; // 5 MB, exactly matches legacy Ripple MAX_CONSENT_SIZE_BYTES

    private static final List<String> DEFAULT_CONSENT_TYPES = List.of(
            "Initial Consent",
            "Re-Consent",
            "Assent",
            "Re-Assent",
            "Age of Majority",
            "Other"
    );

    private static final Set<String> ALLOWED_FILE_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "txt", "rtf", "odt",
            "jpg", "jpeg", "png", "tif", "tiff"
    );

    private final ParticipantConsentLogRepository consentLogRepository;
    private final ParticipantRepository participantRepository;
    private final StudyCandidateRepository candidateRepository;
    private final StudyRepository studyRepository;
    private final UserRepository userRepository;
    private final AuditRecorder auditRecorder;
    private final SitePermissionService sitePermissionService;

    public ParticipantConsentLogService(
            ParticipantConsentLogRepository consentLogRepository,
            ParticipantRepository participantRepository,
            StudyCandidateRepository candidateRepository,
            StudyRepository studyRepository,
            UserRepository userRepository,
            @Autowired(required = false) AuditRecorder auditRecorder,
            @Autowired(required = false) SitePermissionService sitePermissionService) {
        this.consentLogRepository = consentLogRepository;
        this.participantRepository = participantRepository;
        this.candidateRepository = candidateRepository;
        this.studyRepository = studyRepository;
        this.userRepository = userRepository;
        this.auditRecorder = auditRecorder;
        this.sitePermissionService = sitePermissionService;
    }

    @Transactional(readOnly = true)
    public List<ParticipantConsentLogDto> getConsentLogs(
            UUID tenantId,
            UUID participantId,
            UUID studyId,
            UUID callerUserId) {

        participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        List<ParticipantConsentLog> logs = consentLogRepository
                .findByTenantIdAndParticipantIdOrderByStickyDescConsentDateDesc(tenantId, participantId);

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
    public ParticipantConsentLogDto getConsentLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId) {

        ParticipantConsentLog logEntity = consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consent log not found"));

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);

        return toDto(logEntity, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional(readOnly = true)
    public List<ConsentTypeOptionDto> getConsentTypes(UUID tenantId, UUID studyId) {
        Set<String> distinctTypes = new LinkedHashSet<>(DEFAULT_CONSENT_TYPES);

        try {
            List<String> recordedTypes = consentLogRepository.findDistinctConsentTypes(tenantId, studyId);
            if (recordedTypes != null) {
                for (String t : recordedTypes) {
                    if (t != null && !t.isBlank()) {
                        distinctTypes.add(t.trim());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch recorded consent types: {}", e.getMessage());
        }

        return distinctTypes.stream()
                .map(t -> new ConsentTypeOptionDto(t, t))
                .collect(Collectors.toList());
    }

    @Transactional
    public ParticipantConsentLogDto createConsentLog(
            UUID tenantId,
            UUID participantId,
            UUID callerUserId,
            CreateConsentLogRequest request,
            MultipartFile file) {

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

        if (request.getExpiration() != null && request.getConsentDate() != null) {
            if (request.getExpiration().isBefore(request.getConsentDate())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiration date cannot be prior to Consent Date");
            }
        }

        ParticipantConsentLog logEntity = new ParticipantConsentLog();
        logEntity.setTenantId(tenantId);
        logEntity.setParticipantId(participantId);
        logEntity.setStudyId(studyId);
        logEntity.setConsentDate(request.getConsentDate() != null ? request.getConsentDate() : OffsetDateTime.now());
        logEntity.setConsentType(request.getConsentType().trim());
        logEntity.setConsentTitle(request.getConsentTitle().trim());
        logEntity.setConsentedBy(request.getConsentedBy() != null ? request.getConsentedBy().trim() : null);
        logEntity.setVersion(request.getVersion() != null ? request.getVersion().trim() : null);
        logEntity.setExpiration(request.getExpiration());
        logEntity.setComments(request.getComments() != null ? request.getComments().trim() : null);
        logEntity.setSticky(Boolean.TRUE.equals(request.getSticky()));
        logEntity.setNotify(Boolean.TRUE.equals(request.getNotify()));
        logEntity.setGlobal(request.getStudyId() == null || Boolean.TRUE.equals(request.getGlobal()));
        logEntity.setLastContact(Boolean.TRUE.equals(request.getLastContact()));
        logEntity.setCreatedBy(callerUserId);
        logEntity.setUpdatedBy(callerUserId);
        logEntity.setCreatedAt(OffsetDateTime.now());
        logEntity.setUpdatedAt(OffsetDateTime.now());

        // Handle attachment file if present
        if (file != null && !file.isEmpty()) {
            processAndStoreAttachment(tenantId, participantId, file, logEntity);
        }

        ParticipantConsentLog savedLog = consentLogRepository.save(logEntity);

        // Update Last Contact semantics
        if (savedLog.isLastContact()) {
            applyLastContactUpdate(tenantId, participant, savedLog.getStudyId(), savedLog.getConsentDate());
        }

        // Record Audit Event
        recordAuditEvent(
                tenantId,
                callerUserId,
                savedLog.getId(),
                "CREATE",
                "Created consent log for participant " + participantId + " (Title: " + savedLog.getConsentTitle() + ")"
        );

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        return toDto(savedLog, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional
    public ParticipantConsentLogDto updateConsentLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId,
            UpdateConsentLogRequest request,
            MultipartFile file) {

        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        ParticipantConsentLog existing = consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consent log not found"));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        if (!callerUserId.equals(existing.getCreatedBy()) && !isUserAdminOrManager) {
            throw new AccessDeniedException("Access denied: only the author or an administrator can edit this consent log");
        }

        boolean wasLastContact = existing.isLastContact();

        if (request.getConsentDate() != null) existing.setConsentDate(request.getConsentDate());
        if (request.getConsentType() != null && !request.getConsentType().isBlank()) existing.setConsentType(request.getConsentType().trim());
        if (request.getConsentTitle() != null && !request.getConsentTitle().isBlank()) existing.setConsentTitle(request.getConsentTitle().trim());
        if (request.getConsentedBy() != null) existing.setConsentedBy(request.getConsentedBy().trim());
        if (request.getVersion() != null) existing.setVersion(request.getVersion().trim());
        if (request.getExpiration() != null) {
            if (existing.getConsentDate() != null && request.getExpiration().isBefore(existing.getConsentDate())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiration date cannot be prior to Consent Date");
            }
            existing.setExpiration(request.getExpiration());
        }
        if (request.getComments() != null) existing.setComments(request.getComments().trim());
        if (request.getSticky() != null) existing.setSticky(request.getSticky());
        if (request.getNotify() != null) existing.setNotify(request.getNotify());
        if (request.getGlobal() != null) existing.setGlobal(request.getGlobal());
        if (request.getLastContact() != null) existing.setLastContact(request.getLastContact());

        // Check if attachment should be removed or replaced
        if (Boolean.TRUE.equals(request.getRemoveAttachment())) {
            deleteAttachmentFile(existing.getFileStoragePath());
            existing.setFileAttached(false);
            existing.setFileId(null);
            existing.setFileName(null);
            existing.setFileSizeBytes(null);
            existing.setFileContentType(null);
            existing.setFileStoragePath(null);
        }

        if (file != null && !file.isEmpty()) {
            // Delete old file if present
            deleteAttachmentFile(existing.getFileStoragePath());
            processAndStoreAttachment(tenantId, participantId, file, existing);
        }

        existing.setUpdatedBy(callerUserId);
        existing.setUpdatedAt(OffsetDateTime.now());

        ParticipantConsentLog updatedLog = consentLogRepository.save(existing);

        if (!wasLastContact && updatedLog.isLastContact()) {
            applyLastContactUpdate(tenantId, participant, updatedLog.getStudyId(), updatedLog.getConsentDate());
        }

        recordAuditEvent(
                tenantId,
                callerUserId,
                updatedLog.getId(),
                "UPDATE",
                "Updated consent log for participant " + participantId
        );

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return toDto(updatedLog, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional
    public ParticipantConsentLogDto pinConsentLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId,
            boolean sticky) {

        ParticipantConsentLog existing = consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consent log not found"));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        if (!callerUserId.equals(existing.getCreatedBy()) && !isUserAdminOrManager) {
            throw new AccessDeniedException("Access denied: only the author or an administrator can pin this consent log");
        }

        existing.setSticky(sticky);
        existing.setUpdatedBy(callerUserId);
        existing.setUpdatedAt(OffsetDateTime.now());

        ParticipantConsentLog saved = consentLogRepository.save(existing);

        recordAuditEvent(
                tenantId,
                callerUserId,
                saved.getId(),
                sticky ? "PIN" : "UNPIN",
                (sticky ? "Pinned" : "Unpinned") + " consent log for participant " + participantId
        );

        Map<UUID, Study> studiesMap = studyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Study::getId, s -> s, (a, b) -> a));

        Map<UUID, User> usersMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return toDto(saved, studiesMap, usersMap, callerUserId, isUserAdminOrManager);
    }

    @Transactional
    public void deleteConsentLog(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId) {

        Participant participant = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        ParticipantConsentLog existing = consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consent log not found"));

        boolean isUserAdminOrManager = checkUserIsAdminOrManager(tenantId, callerUserId);
        if (!callerUserId.equals(existing.getCreatedBy()) && !isUserAdminOrManager) {
            throw new AccessDeniedException("Access denied: only the author or an administrator can delete this consent log");
        }

        boolean wasLastContact = existing.isLastContact();
        deleteAttachmentFile(existing.getFileStoragePath());
        consentLogRepository.delete(existing);

        if (wasLastContact) {
            recalculateLastContactAfterDeletion(tenantId, participant);
        }

        recordAuditEvent(
                tenantId,
                callerUserId,
                existing.getId(),
                "DELETE",
                "Deleted consent log " + logId + " for participant " + participantId
        );
    }

    @Transactional(readOnly = true)
    public ConsentAttachmentDownload getConsentAttachment(
            UUID tenantId,
            UUID participantId,
            UUID logId,
            UUID callerUserId) {

        ParticipantConsentLog existing = consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consent log not found"));

        if (!existing.isFileAttached() || existing.getFileStoragePath() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No attachment associated with this consent log");
        }

        File file = new File(existing.getFileStoragePath());
        if (!file.exists() || !file.isFile()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment file not found on disk");
        }

        Resource resource = new FileSystemResource(file);
        String contentType = existing.getFileContentType() != null ? existing.getFileContentType() : "application/octet-stream";
        String fileName = existing.getFileName() != null ? existing.getFileName() : file.getName();

        return new ConsentAttachmentDownload(resource, fileName, contentType, file.length());
    }

    public record ConsentAttachmentDownload(Resource resource, String fileName, String contentType, long contentLength) {}

    private void processAndStoreAttachment(
            UUID tenantId,
            UUID participantId,
            MultipartFile file,
            ParticipantConsentLog logEntity) {

        if (file.getSize() > MAX_CONSENT_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Maximum size of a consent attachment is " + Math.round((double) MAX_CONSENT_SIZE_BYTES / (1024 * 1024)) + " megabytes");
        }

        String rawOriginalFilename = file.getOriginalFilename();
        String originalFilename = sanitizeFilename(rawOriginalFilename != null ? rawOriginalFilename : "attachment");
        String extension = getFileExtension(originalFilename);

        if (extension.isEmpty() || !ALLOWED_FILE_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "File format not allowed. Permitted formats include PDF, DOC, DOCX, TXT, images (JPG, PNG).");
        }

        try {
            String baseStorageDir = System.getProperty("user.dir") + File.separator + "uploads" + File.separator + "consents"
                    + File.separator + tenantId + File.separator + participantId;
            Path dirPath = Paths.get(baseStorageDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            UUID fileId = UUID.randomUUID();
            String storedFileName = fileId + "_" + originalFilename;
            Path targetPath = dirPath.resolve(storedFileName);
            file.transferTo(targetPath.toFile());

            logEntity.setFileAttached(true);
            logEntity.setFileId(fileId);
            logEntity.setFileName(originalFilename);
            logEntity.setFileSizeBytes(file.getSize());
            logEntity.setFileContentType(file.getContentType());
            logEntity.setFileStoragePath(targetPath.toAbsolutePath().toString());

        } catch (IOException e) {
            log.error("Failed to store consent attachment: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store consent attachment on disk");
        }
    }

    private void deleteAttachmentFile(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return;
        try {
            File f = new File(storagePath);
            if (f.exists() && f.isFile()) {
                Files.deleteIfExists(f.toPath());
            }
        } catch (Exception e) {
            log.warn("Could not delete attachment file at {}: {}", storagePath, e.getMessage());
        }
    }

    private String sanitizeFilename(String filename) {
        String clean = new File(filename).getName();
        return clean.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }

    private String getFileExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return (idx > 0 && idx < filename.length() - 1) ? filename.substring(idx + 1) : "";
    }

    private void applyLastContactUpdate(UUID tenantId, Participant participant, UUID studyId, OffsetDateTime contactDate) {
        if (contactDate == null) return;

        if (studyId != null) {
            candidateRepository.findByTenantIdAndParticipantId(tenantId, participant.getId()).stream()
                    .filter(c -> studyId.equals(c.getStudyId()))
                    .findFirst()
                    .ifPresent(c -> {
                        if (c.getLastContactAt() == null || contactDate.isAfter(c.getLastContactAt())) {
                            c.setLastContactAt(contactDate);
                            candidateRepository.save(c);
                        }
                    });

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
            participant.setGlobalLastContactDate(contactDate);
            participantRepository.save(participant);
        }
    }

    private void recalculateLastContactAfterDeletion(UUID tenantId, Participant participant) {
        List<ParticipantConsentLog> remaining = consentLogRepository
                .findByTenantIdAndParticipantIdOrderByStickyDescConsentDateDesc(tenantId, participant.getId());

        OffsetDateTime latestMarked = remaining.stream()
                .filter(ParticipantConsentLog::isLastContact)
                .map(ParticipantConsentLog::getConsentDate)
                .max(OffsetDateTime::compareTo)
                .orElse(null);

        if (latestMarked != null) {
            participant.setGlobalLastContactDate(latestMarked);
        } else {
            OffsetDateTime maxCandidate = candidateRepository.findByTenantIdAndParticipantId(tenantId, participant.getId()).stream()
                    .map(StudyCandidate::getLastContactAt)
                    .filter(Objects::nonNull)
                    .max(OffsetDateTime::compareTo)
                    .orElse(null);

            participant.setGlobalLastContactDate(maxCandidate);
        }
        participantRepository.save(participant);
    }

    private void recordAuditEvent(UUID tenantId, UUID actorUserId, UUID entityId, String action, String description) {
        if (auditRecorder == null) return;
        try {
            auditRecorder.record(new AuditEventCommand(
                    tenantId,
                    actorUserId,
                    "PARTICIPANT_CONSENT_LOG",
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

    private ParticipantConsentLogDto toDto(
            ParticipantConsentLog logEntity,
            Map<UUID, Study> studiesMap,
            Map<UUID, User> usersMap,
            UUID callerUserId,
            boolean isUserAdminOrManager) {

        ParticipantConsentLogDto dto = new ParticipantConsentLogDto();
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

        dto.setConsentDate(logEntity.getConsentDate());
        if (logEntity.getConsentDate() != null) {
            dto.setFormattedConsentDate(logEntity.getConsentDate().format(DISPLAY_DT_FMT));
        }

        dto.setConsentType(logEntity.getConsentType());
        dto.setConsentTitle(logEntity.getConsentTitle());
        dto.setConsentedBy(logEntity.getConsentedBy());
        dto.setVersion(logEntity.getVersion());
        dto.setExpiration(logEntity.getExpiration());
        if (logEntity.getExpiration() != null) {
            dto.setFormattedExpiration(logEntity.getExpiration().format(DISPLAY_DATE_ONLY_FMT));
        }

        dto.setFileAttached(logEntity.isFileAttached());
        dto.setFileId(logEntity.getFileId());
        dto.setFileName(logEntity.getFileName());
        dto.setFileSizeBytes(logEntity.getFileSizeBytes());
        dto.setFileContentType(logEntity.getFileContentType());
        if (logEntity.isFileAttached()) {
            dto.setDownloadUrl("/api/v1/participants/" + logEntity.getParticipantId() + "/consent-logs/" + logEntity.getId() + "/attachment");
        }

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
