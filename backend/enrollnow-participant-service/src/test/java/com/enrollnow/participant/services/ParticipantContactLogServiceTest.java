package com.enrollnow.participant.services;

import com.enrollnow.identity.models.AuditEvent;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.AuditEventRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.services.SitePermissionService;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantContactLogServiceTest {

    @Mock private ParticipantContactLogRepository contactLogRepository;
    @Mock private ContactOutcomeRepository outcomeRepository;
    @Mock private ParticipantRepository participantRepository;
    @Mock private ParticipantContactRepository participantContactRepository;
    @Mock private StudyCandidateRepository candidateRepository;
    @Mock private StudyRepository studyRepository;
    @Mock private StudyMemberRepository studyMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserEmailRepository userEmailRepository;
    @Mock private AuditEventRepository auditEventRepository;
    @Mock private SitePermissionService sitePermissionService;

    private ParticipantContactLogService service;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID participantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID callerUserId = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private final UUID studyId = UUID.fromString("44444444-4444-4444-4444-444444444444");

    private Participant testParticipant;
    private User testUser;
    private Study testStudy;

    @BeforeEach
    void setUp() {
        service = new ParticipantContactLogService(
                contactLogRepository,
                outcomeRepository,
                participantRepository,
                participantContactRepository,
                candidateRepository,
                studyRepository,
                studyMemberRepository,
                userRepository,
                userEmailRepository,
                auditEventRepository,
                sitePermissionService
        );

        testParticipant = new Participant();
        testParticipant.setId(participantId);
        testParticipant.setTenantId(tenantId);
        testParticipant.setFirstName("Alice");
        testParticipant.setLastName("Smith");

        testUser = new User();
        testUser.setId(callerUserId);
        testUser.setTenantId(tenantId);
        testUser.setFirstName("Dr. Bob");
        testUser.setLastName("Coordinator");

        testStudy = new Study();
        testStudy.setId(studyId);
        testStudy.setTenantId(tenantId);
        testStudy.setName("Autism Biomarker Study");
    }

    @Test
    void createContactLog_validGlobalRegistryLog_persistsAndCalculatesGlobalLastContact() {
        when(participantRepository.findByTenantIdAndId(tenantId, participantId))
                .thenReturn(Optional.of(testParticipant));
        when(userRepository.findByTenantIdAndId(tenantId, callerUserId))
                .thenReturn(Optional.of(testUser));
        when(outcomeRepository.existsByTenantIdAndOutcomeIgnoreCase(tenantId, "Spoke to patient"))
                .thenReturn(true);

        OffsetDateTime now = OffsetDateTime.now();
        CreateContactLogRequest request = new CreateContactLogRequest();
        request.setContactType("Phone Call");
        request.setContactedBy(callerUserId);
        request.setOutcome("Spoke to patient");
        request.setDateTimeOfContact(now);
        request.setSpokeTo("Mother");
        request.setRegarding("Scheduled appointment reminder");
        request.setComments("Follow up in 2 weeks");
        request.setLastContact(true);
        request.setSticky(true);

        when(contactLogRepository.save(any(ParticipantContactLog.class))).thenAnswer(invocation -> {
            ParticipantContactLog entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        ParticipantContactLogDto result = service.createContactLog(tenantId, participantId, callerUserId, request);

        assertThat(result).isNotNull();
        assertThat(result.getContactType()).isEqualTo("Phone Call");
        assertThat(result.getSpokeTo()).isEqualTo("Mother");
        assertThat(result.isSticky()).isTrue();
        assertThat(result.isLastContact()).isTrue();
        assertThat(result.isGlobal()).isTrue();

        // Verify global last contact date updated on participant
        assertThat(testParticipant.getGlobalLastContactDate()).isEqualTo(now);
        verify(participantRepository).save(testParticipant);

        // Verify audit event logged
        ArgumentCaptor<AuditEvent> auditCaptor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(auditEventRepository).save(auditCaptor.capture());
        AuditEvent event = auditCaptor.getValue();
        assertThat(event.getEntityType()).isEqualTo("PARTICIPANT_CONTACT_LOG");
        assertThat(event.getAction()).isEqualTo("CREATE");
        assertThat(event.getActorUserId()).isEqualTo(callerUserId);
    }

    @Test
    void createContactLog_throwsNotFoundWhenParticipantDoesNotExist() {
        when(participantRepository.findByTenantIdAndId(tenantId, participantId))
                .thenReturn(Optional.empty());

        CreateContactLogRequest request = new CreateContactLogRequest();
        request.setContactType("Email");
        request.setContactedBy(callerUserId);
        request.setOutcome("Sent email");

        assertThrows(ResponseStatusException.class, () ->
                service.createContactLog(tenantId, participantId, callerUserId, request)
        );
    }

    @Test
    void createContactLog_studySpecificLog_updatesCandidateLastContactAndMaxGlobal() {
        when(participantRepository.findByTenantIdAndId(tenantId, participantId))
                .thenReturn(Optional.of(testParticipant));
        when(studyRepository.findByTenantIdAndId(tenantId, studyId))
                .thenReturn(Optional.of(testStudy));
        when(userRepository.findByTenantIdAndId(tenantId, callerUserId))
                .thenReturn(Optional.of(testUser));

        StudyCandidate candidate = new StudyCandidate();
        candidate.setId(UUID.randomUUID());
        candidate.setTenantId(tenantId);
        candidate.setParticipantId(participantId);
        candidate.setStudyId(studyId);
        candidate.setLastContactAt(OffsetDateTime.now().minusDays(5));

        when(candidateRepository.findByTenantIdAndParticipantId(tenantId, participantId))
                .thenReturn(List.of(candidate));

        OffsetDateTime contactDate = OffsetDateTime.now();
        CreateContactLogRequest request = new CreateContactLogRequest();
        request.setStudyId(studyId);
        request.setContactType("In Person");
        request.setContactedBy(callerUserId);
        request.setOutcome("Screening Completed");
        request.setDateTimeOfContact(contactDate);
        request.setLastContact(true);

        when(contactLogRepository.save(any(ParticipantContactLog.class))).thenAnswer(inv -> {
            ParticipantContactLog log = inv.getArgument(0);
            log.setId(UUID.randomUUID());
            return log;
        });

        ParticipantContactLogDto dto = service.createContactLog(tenantId, participantId, callerUserId, request);

        assertThat(dto).isNotNull();
        assertThat(candidate.getLastContactAt()).isEqualTo(contactDate);
        verify(candidateRepository).save(candidate);
        assertThat(testParticipant.getGlobalLastContactDate()).isEqualTo(contactDate);
        verify(participantRepository).save(testParticipant);
    }

    @Test
    void updateContactLog_nonOwnerCannotUpdateWithoutAdminRole() {
        UUID otherUser = UUID.randomUUID();
        ParticipantContactLog log = new ParticipantContactLog();
        log.setId(UUID.randomUUID());
        log.setTenantId(tenantId);
        log.setParticipantId(participantId);
        log.setCreatedBy(otherUser);

        when(participantRepository.findByTenantIdAndId(tenantId, participantId))
                .thenReturn(Optional.of(testParticipant));
        when(contactLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, log.getId()))
                .thenReturn(Optional.of(log));

        UpdateContactLogRequest request = new UpdateContactLogRequest();
        request.setComments("Trying to update without authorization");

        assertThrows(AccessDeniedException.class, () ->
                service.updateContactLog(tenantId, participantId, log.getId(), callerUserId, request)
        );
    }

    @Test
    void pinContactLog_ownerCanTogglePin() {
        ParticipantContactLog log = new ParticipantContactLog();
        log.setId(UUID.randomUUID());
        log.setTenantId(tenantId);
        log.setParticipantId(participantId);
        log.setCreatedBy(callerUserId);
        log.setSticky(false);

        when(contactLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, log.getId()))
                .thenReturn(Optional.of(log));
        when(contactLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParticipantContactLogDto pinned = service.pinContactLog(tenantId, participantId, log.getId(), callerUserId, true);

        assertThat(pinned.isSticky()).isTrue();
        ArgumentCaptor<AuditEvent> auditCaptor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(auditEventRepository).save(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getAction()).isEqualTo("PIN");
    }

    @Test
    void deleteContactLog_deletesAndRecalculatesLastContact() {
        ParticipantContactLog log = new ParticipantContactLog();
        log.setId(UUID.randomUUID());
        log.setTenantId(tenantId);
        log.setParticipantId(participantId);
        log.setCreatedBy(callerUserId);
        log.setLastContact(true);

        when(participantRepository.findByTenantIdAndId(tenantId, participantId))
                .thenReturn(Optional.of(testParticipant));
        when(contactLogRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, log.getId()))
                .thenReturn(Optional.of(log));
        when(contactLogRepository.findByTenantIdAndParticipantIdOrderByStickyDescDateTimeOfContactDesc(tenantId, participantId))
                .thenReturn(Collections.emptyList());

        service.deleteContactLog(tenantId, participantId, log.getId(), callerUserId);

        verify(contactLogRepository).delete(log);
        verify(participantRepository).save(testParticipant);
        verify(auditEventRepository).save(any(AuditEvent.class));
    }

    @Test
    void getContactTypes_returnsDefaultsAndDynamicTypes() {
        when(contactLogRepository.findDistinctContactTypes(tenantId, null))
                .thenReturn(List.of("Custom Video Call", "Phone Call"));

        List<ContactTypeOptionDto> types = service.getContactTypes(tenantId, null);

        assertThat(types).extracting(ContactTypeOptionDto::getValue)
                .contains("Phone Call", "Email", "Text Message", "Custom Video Call");
    }

    @Test
    void getParticipantContactMethods_returnsFormattedOptionsWithPreferredFlag() {
        ParticipantContact emailContact = new ParticipantContact();
        emailContact.setContactType("EMAIL");
        emailContact.setContactValue("alice@example.com");
        emailContact.setPrimaryContact(true);

        ParticipantContact phoneContact = new ParticipantContact();
        phoneContact.setContactType("PHONE");
        phoneContact.setContactValue("+1 555-0199");
        phoneContact.setPrimaryContact(false);

        when(participantContactRepository.findByTenantIdAndParticipantId(tenantId, participantId))
                .thenReturn(List.of(emailContact, phoneContact));

        List<ContactMethodOptionDto> methods = service.getParticipantContactMethods(tenantId, participantId, null);

        assertThat(methods).hasSize(2);
        assertThat(methods.get(0).getValue()).isEqualTo("alice@example.com");
        assertThat(methods.get(0).isPreferred()).isTrue();
        assertThat(methods.get(1).getValue()).isEqualTo("+1 555-0199");
        assertThat(methods.get(1).isPreferred()).isFalse();
    }
}
