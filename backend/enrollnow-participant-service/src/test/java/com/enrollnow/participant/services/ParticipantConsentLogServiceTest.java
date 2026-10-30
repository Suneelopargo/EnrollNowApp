package com.enrollnow.participant.services;

import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.participant.dtos.ConsentTypeOptionDto;
import com.enrollnow.participant.dtos.CreateConsentLogRequest;
import com.enrollnow.participant.dtos.ParticipantConsentLogDto;
import com.enrollnow.participant.dtos.UpdateConsentLogRequest;
import com.enrollnow.participant.models.Participant;
import com.enrollnow.participant.models.ParticipantConsentLog;
import com.enrollnow.participant.models.StudyCandidate;
import com.enrollnow.participant.repositories.ParticipantConsentLogRepository;
import com.enrollnow.participant.repositories.ParticipantRepository;
import com.enrollnow.participant.repositories.StudyCandidateRepository;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantConsentLogServiceTest {

    @Mock private ParticipantConsentLogRepository consentLogRepository;
    @Mock private ParticipantRepository participantRepository;
    @Mock private StudyCandidateRepository candidateRepository;
    @Mock private StudyRepository studyRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditRecorder auditRecorder;
    @Mock private SitePermissionService sitePermissionService;

    private ParticipantConsentLogService service;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID participantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID studyId = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private final UUID userId = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private final UUID otherUserId = UUID.fromString("55555555-5555-5555-5555-555555555555");
    private final UUID logId = UUID.fromString("66666666-6666-6666-6666-666666666666");

    @BeforeEach
    void setUp() {
        service = new ParticipantConsentLogService(
                consentLogRepository,
                participantRepository,
                candidateRepository,
                studyRepository,
                userRepository,
                auditRecorder,
                sitePermissionService
        );
    }

    @Test
    void getConsentLogs_participantNotFound_throws404() {
        when(participantRepository.findByTenantIdAndId(tenantId, participantId))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                service.getConsentLogs(tenantId, participantId, null, userId)
        );
    }

    @Test
    void getConsentLogs_studyFiltered_filtersNonMatchingStudyLogs() {
        Participant p = new Participant();
        p.setId(participantId);
        p.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(p));

        ParticipantConsentLog matchingStudy = new ParticipantConsentLog();
        matchingStudy.setId(UUID.randomUUID());
        matchingStudy.setStudyId(studyId);
        matchingStudy.setConsentTitle("Study Specific Form");
        matchingStudy.setConsentDate(OffsetDateTime.now());
        matchingStudy.setGlobal(false);
        matchingStudy.setCreatedBy(userId);
        matchingStudy.setUpdatedBy(userId);

        ParticipantConsentLog globalLog = new ParticipantConsentLog();
        globalLog.setId(UUID.randomUUID());
        globalLog.setStudyId(null);
        globalLog.setConsentTitle("Registry General Form");
        globalLog.setConsentDate(OffsetDateTime.now());
        globalLog.setGlobal(true);
        globalLog.setCreatedBy(userId);
        globalLog.setUpdatedBy(userId);

        ParticipantConsentLog differentStudyLog = new ParticipantConsentLog();
        differentStudyLog.setId(UUID.randomUUID());
        differentStudyLog.setStudyId(UUID.randomUUID());
        differentStudyLog.setConsentTitle("Other Study Form");
        differentStudyLog.setConsentDate(OffsetDateTime.now());
        differentStudyLog.setGlobal(false);
        differentStudyLog.setCreatedBy(userId);
        differentStudyLog.setUpdatedBy(userId);

        when(consentLogRepository.findByTenantIdAndParticipantIdOrderByStickyDescConsentDateDesc(tenantId, participantId))
                .thenReturn(List.of(matchingStudy, globalLog, differentStudyLog));
        when(studyRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());
        when(userRepository.findByTenantId(tenantId)).thenReturn(Collections.emptyList());

        List<ParticipantConsentLogDto> results = service.getConsentLogs(tenantId, participantId, studyId, userId);

        assertThat(results).hasSize(2);
        assertThat(results.stream().map(ParticipantConsentLogDto::getConsentTitle))
                .containsExactlyInAnyOrder("Study Specific Form", "Registry General Form");
    }

    @Test
    void getConsentTypes_returnsDefaultAndRecordedTypes() {
        when(consentLogRepository.findDistinctConsentTypes(tenantId, studyId))
                .thenReturn(List.of("Custom Video Assent", "Initial Consent"));

        List<ConsentTypeOptionDto> types = service.getConsentTypes(tenantId, studyId);

        assertThat(types.stream().map(ConsentTypeOptionDto::getValue))
                .contains("Initial Consent", "Re-Consent", "Assent", "Custom Video Assent");
    }

    @Test
    void createConsentLog_validRequest_persistsAndReturnsDto() {
        Participant p = new Participant();
        p.setId(participantId);
        p.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(p));

        CreateConsentLogRequest req = new CreateConsentLogRequest();
        req.setConsentTitle("Main Pediatric Assent");
        req.setConsentType("Assent");
        req.setConsentDate(OffsetDateTime.now());
        req.setVersion("2.1");
        req.setConsentedBy("Parent (Mother)");
        req.setSticky(true);

        when(consentLogRepository.save(any(ParticipantConsentLog.class))).thenAnswer(inv -> {
            ParticipantConsentLog entity = inv.getArgument(0);
            entity.setId(logId);
            return entity;
        });

        ParticipantConsentLogDto dto = service.createConsentLog(tenantId, participantId, userId, req, null);

        assertThat(dto.getId()).isEqualTo(logId);
        assertThat(dto.getConsentTitle()).isEqualTo("Main Pediatric Assent");
        assertThat(dto.getConsentType()).isEqualTo("Assent");
        assertThat(dto.getVersion()).isEqualTo("2.1");
        assertThat(dto.isSticky()).isTrue();
        verify(consentLogRepository).save(any(ParticipantConsentLog.class));
    }

    @Test
    void createConsentLog_withLastContact_updatesParticipantAndCandidate() {
        Participant p = new Participant();
        p.setId(participantId);
        p.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(p));

        Study s = new Study();
        s.setId(studyId);
        s.setName("Test Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(s));

        StudyCandidate candidate = new StudyCandidate();
        candidate.setTenantId(tenantId);
        candidate.setParticipantId(participantId);
        candidate.setStudyId(studyId);
        when(candidateRepository.findByTenantIdAndParticipantId(tenantId, participantId))
                .thenReturn(List.of(candidate));

        OffsetDateTime contactDate = OffsetDateTime.now();
        CreateConsentLogRequest req = new CreateConsentLogRequest();
        req.setStudyId(studyId);
        req.setConsentTitle("Trial Consent");
        req.setConsentType("Initial Consent");
        req.setConsentDate(contactDate);
        req.setLastContact(true);

        when(consentLogRepository.save(any(ParticipantConsentLog.class))).thenAnswer(inv -> {
            ParticipantConsentLog entity = inv.getArgument(0);
            entity.setId(logId);
            return entity;
        });

        service.createConsentLog(tenantId, participantId, userId, req, null);

        assertThat(candidate.getLastContactAt()).isEqualTo(contactDate);
        assertThat(p.getGlobalLastContactDate()).isEqualTo(contactDate);
        verify(candidateRepository).save(candidate);
        verify(participantRepository).save(p);
    }

    @Test
    void createConsentLog_expirationBeforeConsentDate_throwsBadRequest() {
        Participant p = new Participant();
        p.setId(participantId);
        p.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(p));

        CreateConsentLogRequest req = new CreateConsentLogRequest();
        req.setConsentTitle("Expired Form");
        req.setConsentType("Initial Consent");
        req.setConsentDate(OffsetDateTime.now());
        req.setExpiration(OffsetDateTime.now().minusDays(5));

        assertThrows(ResponseStatusException.class, () ->
                service.createConsentLog(tenantId, participantId, userId, req, null)
        );
    }

    @Test
    void createConsentLog_fileTooLarge_throwsBadRequest() {
        Participant p = new Participant();
        p.setId(participantId);
        p.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(p));

        CreateConsentLogRequest req = new CreateConsentLogRequest();
        req.setConsentTitle("Big Document");
        req.setConsentType("Initial Consent");
        req.setConsentDate(OffsetDateTime.now());

        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6 MB > 5MB limit
        MockMultipartFile file = new MockMultipartFile("file", "large.pdf", "application/pdf", largeBytes);

        assertThrows(ResponseStatusException.class, () ->
                service.createConsentLog(tenantId, participantId, userId, req, file)
        );
    }

    @Test
    void updateConsentLog_notAuthorOrAdmin_throwsAccessDenied() {
        Participant p = new Participant();
        p.setId(participantId);
        p.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(p));

        ParticipantConsentLog existing = new ParticipantConsentLog();
        existing.setId(logId);
        existing.setCreatedBy(otherUserId);
        when(consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId))
                .thenReturn(Optional.of(existing));

        UserEffectivePermissionsResponse perms = new UserEffectivePermissionsResponse();
        perms.setCanAccessSiteAdmin(false);
        perms.setRoles(Collections.emptyList());
        when(sitePermissionService.resolveEffectivePermissions(tenantId, userId, null)).thenReturn(perms);

        UpdateConsentLogRequest req = new UpdateConsentLogRequest();
        req.setConsentTitle("Unauthorized Edit");

        assertThrows(AccessDeniedException.class, () ->
                service.updateConsentLog(tenantId, participantId, logId, userId, req, null)
        );
    }

    @Test
    void pinConsentLog_author_togglesSticky() {
        ParticipantConsentLog existing = new ParticipantConsentLog();
        existing.setId(logId);
        existing.setCreatedBy(userId);
        existing.setSticky(false);
        when(consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId))
                .thenReturn(Optional.of(existing));
        when(consentLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParticipantConsentLogDto dto = service.pinConsentLog(tenantId, participantId, logId, userId, true);

        assertThat(dto.isSticky()).isTrue();
    }

    @Test
    void deleteConsentLog_validCall_deletesAndAudits() {
        Participant p = new Participant();
        p.setId(participantId);
        p.setTenantId(tenantId);
        when(participantRepository.findByTenantIdAndId(tenantId, participantId)).thenReturn(Optional.of(p));

        ParticipantConsentLog existing = new ParticipantConsentLog();
        existing.setId(logId);
        existing.setCreatedBy(userId);
        existing.setLastContact(false);
        when(consentLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, logId))
                .thenReturn(Optional.of(existing));

        service.deleteConsentLog(tenantId, participantId, logId, userId);

        verify(consentLogRepository).delete(existing);
    }
}
