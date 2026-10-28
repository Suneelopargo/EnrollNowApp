package com.enrollnow.study.services;

import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.TeamMembership;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.TeamMembershipRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.study.dtos.CopyStudyRequest;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.ImportStudyResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.exceptions.DuplicateStudyNameException;
import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.models.TeamStudy;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import com.enrollnow.study.repositories.TeamStudyRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyCopyAndImportServiceTest {

    @Mock
    private StudyRepository studyRepository;

    @Mock
    private MyStudiesService myStudiesService;

    @Mock
    private StudyRequirementRepository studyRequirementRepository;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Mock
    private TeamMembershipRepository teamMembershipRepository;

    @Mock
    private TeamStudyRepository teamStudyRepository;

    private StudyConfigurationService studyConfigurationService;
    private StudyService studyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID otherTenantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID userId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID sourceStudyId = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private final UUID newStudyId = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @BeforeEach
    void setUp() {
        studyConfigurationService = new StudyConfigurationService(studyRequirementRepository, objectMapper);
        studyService = new StudyService(
                studyRepository,
                myStudiesService,
                studyConfigurationService,
                studyMemberRepository,
                roleRepository,
                userRoleAssignmentRepository,
                teamMembershipRepository,
                teamStudyRepository
        );
    }

    @Test
    @DisplayName("Create study with valid short name succeeds and creates default configuration")
    void createStudy_validName_succeeds() {
        CreateStudyRequest req = new CreateStudyRequest("Cardio101", null, "Cardiology trial", 120);

        when(studyRepository.existsByTenantIdAndNameIgnoreCase(tenantId, "Cardio101")).thenReturn(false);
        when(studyRepository.existsByTenantIdAndStudyCode(eq(tenantId), any())).thenReturn(false);
        when(studyRepository.save(any(Study.class))).thenAnswer(inv -> {
            Study s = inv.getArgument(0);
            s.setId(newStudyId);
            return s;
        });
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, newStudyId)).thenReturn(Optional.empty());
        when(studyRequirementRepository.save(any(StudyRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

        StudySummaryResponse response = studyService.createStudy(tenantId, req, userId);

        assertNotNull(response);
        assertEquals("Cardio101", response.getName());
        assertEquals(120, response.getSampleSize());

        // Verify StudyRequirement was saved with default statuses, groups, events
        ArgumentCaptor<StudyRequirement> reqCaptor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(reqCaptor.capture());
        StudyRequirement savedReq = reqCaptor.getValue();
        assertEquals(newStudyId, savedReq.getStudyId());
        assertEquals(120, savedReq.getSampleSize());
        assertTrue(savedReq.getConfiguration().contains("Enrolled Participants"));
        assertTrue(savedReq.getConfiguration().contains("Potential Participants"));
        assertTrue(savedReq.getConfiguration().contains("Intake"));

        // Verify creator membership was created
        verify(studyMemberRepository).save(any(StudyMember.class));
    }

    @Test
    @DisplayName("Create study with empty or whitespace name is rejected")
    void createStudy_emptyOrWhitespaceName_throwsInvalidStudyException() {
        assertThrows(InvalidStudyException.class, () ->
                studyService.createStudy(tenantId, new CreateStudyRequest("", null, "", 100), userId));

        assertThrows(InvalidStudyException.class, () ->
                studyService.createStudy(tenantId, new CreateStudyRequest("   ", null, "", 100), userId));

        assertThrows(InvalidStudyException.class, () ->
                studyService.createStudy(tenantId, new CreateStudyRequest(null, null, "", 100), userId));

        verify(studyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create study with name > 15 characters is rejected without silent truncation")
    void createStudy_nameLongerThan15_throwsInvalidStudyException() {
        CreateStudyRequest req = new CreateStudyRequest("ThisNameIsWayTooLongForShortName", null, "", 100);

        InvalidStudyException ex = assertThrows(InvalidStudyException.class, () ->
                studyService.createStudy(tenantId, req, userId));

        assertTrue(ex.getMessage().contains("must not exceed 15 characters"));
        verify(studyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create study with duplicate name within tenant is rejected")
    void createStudy_duplicateName_throwsDuplicateStudyNameException() {
        CreateStudyRequest req = new CreateStudyRequest("DuplicateStudy", null, "", 100);

        when(studyRepository.existsByTenantIdAndNameIgnoreCase(tenantId, "DuplicateStudy")).thenReturn(true);

        DuplicateStudyNameException ex = assertThrows(DuplicateStudyNameException.class, () ->
                studyService.createStudy(tenantId, req, userId));

        assertEquals("Study name already exists. Please choose another", ex.getMessage());
        verify(studyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Copy study from authorized source study succeeds, clones configuration and remaps IDs")
    void copyStudy_authorizedSource_succeeds() throws Exception {
        Study sourceStudy = new Study();
        sourceStudy.setId(sourceStudyId);
        sourceStudy.setTenantId(tenantId);
        sourceStudy.setName("SourceStudy");
        sourceStudy.setStudyCode("SRC-01");
        sourceStudy.setDescription("Source study description");
        sourceStudy.setSampleSize(150);

        when(studyRepository.findByTenantIdAndId(tenantId, sourceStudyId)).thenReturn(Optional.of(sourceStudy));
        when(studyRepository.existsByTenantIdAndNameIgnoreCase(tenantId, "ClonedStudy")).thenReturn(false);
        when(studyRepository.existsByTenantIdAndStudyCode(eq(tenantId), any())).thenReturn(false);

        // Mock source study requirement with statuses, groups, events, and templates
        Map<String, Object> sourceConfig = new LinkedHashMap<>();
        sourceConfig.put("statuses", List.of(
                Map.of("_id", "old_status_1", "name", "Enrolled", "rank", 0),
                Map.of("_id", "old_status_2", "name", "Screening", "rank", 1)
        ));
        sourceConfig.put("studyGroups", List.of(
                Map.of("_id", "old_grp_1", "label", "Entire Sample")
        ));
        sourceConfig.put("events", List.of(
                Map.of("_id", "old_evt_1", "name", "Intake", "statuses", List.of("old_status_1", "old_status_2"))
        ));

        StudyRequirement sourceReq = new StudyRequirement();
        sourceReq.setStudyId(sourceStudyId);
        sourceReq.setTenantId(tenantId);
        sourceReq.setSampleSize(150);
        sourceReq.setConfiguration(objectMapper.writeValueAsString(sourceConfig));

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, sourceStudyId)).thenReturn(Optional.of(sourceReq));
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, newStudyId)).thenReturn(Optional.empty());
        when(studyRequirementRepository.save(any(StudyRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

        when(studyRepository.save(any(Study.class))).thenAnswer(inv -> {
            Study s = inv.getArgument(0);
            s.setId(newStudyId);
            return s;
        });

        CopyStudyRequest copyReq = new CopyStudyRequest("ClonedStudy", sourceStudyId.toString());
        StudySummaryResponse response = studyService.copyStudy(tenantId, copyReq, userId);

        assertNotNull(response);
        assertEquals("ClonedStudy", response.getName());
        assertEquals(150, response.getSampleSize());

        // Verify configuration was cloned with remapped IDs
        ArgumentCaptor<StudyRequirement> reqCaptor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(reqCaptor.capture());
        StudyRequirement savedReq = reqCaptor.getValue();
        assertEquals(newStudyId, savedReq.getStudyId());

        Map<String, Object> savedConfig = objectMapper.readValue(savedReq.getConfiguration(), new TypeReference<>() {});
        List<Map<String, Object>> savedStatuses = (List<Map<String, Object>>) savedConfig.get("statuses");
        assertNotEquals("old_status_1", savedStatuses.get(0).get("_id"));
        assertNotEquals("old_status_2", savedStatuses.get(1).get("_id"));

        List<Map<String, Object>> savedEvents = (List<Map<String, Object>>) savedConfig.get("events");
        List<String> eventStatuses = (List<String>) savedEvents.get(0).get("statuses");
        assertEquals(savedStatuses.get(0).get("_id"), eventStatuses.get(0));
        assertEquals(savedStatuses.get(1).get("_id"), eventStatuses.get(1));
    }

    @Test
    @DisplayName("Copy study rejects source study when it does not exist")
    void copyStudy_nonExistentSource_throwsStudyNotFoundException() {
        when(studyRepository.findByTenantIdAndId(tenantId, sourceStudyId)).thenReturn(Optional.empty());
        when(studyRepository.findByTenantIdAndStudyCode(tenantId, sourceStudyId.toString())).thenReturn(Optional.empty());

        CopyStudyRequest copyReq = new CopyStudyRequest("NewStudy", sourceStudyId.toString());

        assertThrows(StudyNotFoundException.class, () ->
                studyService.copyStudy(tenantId, copyReq, userId));

        verify(studyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Copy study rejects source study belonging to another tenant")
    void copyStudy_crossTenantSource_throwsInvalidStudyException() {
        Study crossTenantStudy = new Study();
        crossTenantStudy.setId(sourceStudyId);
        crossTenantStudy.setTenantId(otherTenantId); // belongs to other tenant
        crossTenantStudy.setName("OtherStudy");

        when(studyRepository.findByTenantIdAndId(tenantId, sourceStudyId)).thenReturn(Optional.of(crossTenantStudy));

        CopyStudyRequest copyReq = new CopyStudyRequest("NewStudy", sourceStudyId.toString());

        InvalidStudyException ex = assertThrows(InvalidStudyException.class, () ->
                studyService.copyStudy(tenantId, copyReq, userId));

        assertTrue(ex.getMessage().contains("cannot copy a study from another tenant"));
        verify(studyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Import study from valid legacy JSON file structure successfully parses and remaps data")
    void importStudy_validLegacyJson_succeeds() {
        Map<String, Object> legacyPayload = new LinkedHashMap<>();
        legacyPayload.put("studyName", "ImportedStudy");
        legacyPayload.put("studyRequirements", Map.of("sampleSize", 200));

        legacyPayload.put("statuses", List.of(
                Map.of("_id", "stat_old_1", "name", "Enrolled Participants", "rank", 0),
                Map.of("_id", "stat_old_2", "name", "Potential Participants", "rank", 1)
        ));

        legacyPayload.put("studyGroups", List.of(
                Map.of("_id", "grp_old_1", "label", "Entire Sample", "defaultCategoryName", "age")
        ));

        legacyPayload.put("customVariables", List.of(
                Map.of("_id", "cv_old_1", "name", "BloodType", "variableType", "single",
                        "options", List.of(Map.of("name", "A+", "optionId", "opt_old_1")))
        ));

        legacyPayload.put("events", List.of(
                Map.of("_id", "evt_old_1", "name", "Intake", "statuses", List.of("stat_old_1", "stat_old_2"))
        ));

        legacyPayload.put("surveys", List.of(
                Map.of("_id", "srv_old_1", "name", "Screening Form",
                        "surveyJSON", "{\"type\":\"form\",\"status\":\"stat_old_1\",\"variable\":\"cv_old_1\"}")
        ));

        when(studyRepository.existsByTenantIdAndNameIgnoreCase(tenantId, "ImportedStudy")).thenReturn(false);
        when(studyRepository.existsByTenantIdAndStudyCode(eq(tenantId), any())).thenReturn(false);
        when(studyRepository.save(any(Study.class))).thenAnswer(inv -> {
            Study s = inv.getArgument(0);
            s.setId(newStudyId);
            return s;
        });
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, newStudyId)).thenReturn(Optional.empty());
        when(studyRequirementRepository.save(any(StudyRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

        ImportStudyResponse response = studyService.importStudy(tenantId, "ImportedStudy", legacyPayload, userId);

        assertNotNull(response);
        assertEquals(newStudyId, response.getStudyId());
        assertEquals("ImportedStudy", response.getName());
        assertEquals(2, response.getImportedEntitiesSummary().get("statuses"));
        assertEquals(1, response.getImportedEntitiesSummary().get("events"));
        assertEquals(1, response.getImportedEntitiesSummary().get("surveys"));

        // Verify StudyRequirement was persisted with updated survey JSON containing remapped IDs
        ArgumentCaptor<StudyRequirement> reqCaptor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(reqCaptor.capture());
        StudyRequirement savedReq = reqCaptor.getValue();
        assertEquals(200, savedReq.getSampleSize());
        assertFalse(savedReq.getConfiguration().contains("stat_old_1"));
        assertFalse(savedReq.getConfiguration().contains("cv_old_1"));
    }

    @Test
    @DisplayName("Import study rejects invalid or duplicate name")
    void importStudy_duplicateOrInvalidName_throwsException() {
        assertThrows(InvalidStudyException.class, () ->
                studyService.importStudy(tenantId, "", Map.of("some", "data"), userId));

        assertThrows(InvalidStudyException.class, () ->
                studyService.importStudy(tenantId, "NameExceedingFifteenChars", Map.of("some", "data"), userId));

        when(studyRepository.existsByTenantIdAndNameIgnoreCase(tenantId, "DuplicateImport")).thenReturn(true);

        assertThrows(DuplicateStudyNameException.class, () ->
                studyService.importStudy(tenantId, "DuplicateImport", Map.of("some", "data"), userId));

        verify(studyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Import study rejects empty or null payload")
    void importStudy_emptyPayload_throwsInvalidStudyException() {
        when(studyRepository.existsByTenantIdAndNameIgnoreCase(tenantId, "ValidStudy")).thenReturn(false);

        assertThrows(InvalidStudyException.class, () ->
                studyService.importStudy(tenantId, "ValidStudy", null, userId));

        assertThrows(InvalidStudyException.class, () ->
                studyService.importStudy(tenantId, "ValidStudy", Collections.emptyMap(), userId));

        verify(studyRepository, never()).save(any());
    }
}
