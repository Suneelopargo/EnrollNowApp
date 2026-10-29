package com.enrollnow.study.services;

import com.enrollnow.study.dtos.*;
import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.StudyMilestone;
import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.repositories.StudyMilestoneRepository;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyConfigurationServiceTest {

    @Mock
    private StudyRequirementRepository studyRequirementRepository;

    @Mock
    private StudyMilestoneRepository studyMilestoneRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private StudyConfigurationService configurationService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        configurationService = new StudyConfigurationService(studyRequirementRepository, objectMapper, studyMilestoneRepository);
    }

    @Test
    void importComponents_studyNotFound_throwsStudyNotFoundException() {
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.empty());

        assertThrows(
                StudyNotFoundException.class,
                () -> configurationService.importComponentsIntoExistingStudy(tenantId, studyId, Map.of("statuses", List.of()))
        );
    }

    @Test
    void importComponents_emptyComponents_returnsZeroWithoutModifying() {
        Map<String, Object> result = configurationService.importComponentsIntoExistingStudy(tenantId, studyId, Collections.emptyMap());
        assertEquals(0, result.get("importedCount"));
        verify(studyRequirementRepository, never()).save(any());
    }

    @Test
    void importComponents_malformedCategoryNotList_throwsInvalidStudyException() {
        Map<String, Object> components = Map.of("statuses", "not-a-list");

        assertThrows(
                InvalidStudyException.class,
                () -> configurationService.importComponentsIntoExistingStudy(tenantId, studyId, components)
        );
    }

    @Test
    void importComponents_selectiveImport_preservesExistingUnrelatedConfigurations() throws Exception {
        Map<String, Object> existingConfig = new LinkedHashMap<>();
        existingConfig.put("studyGroups", List.of(Map.of("_id", "grp_1", "name", "Cohort A")));
        existingConfig.put("events", List.of(Map.of("_id", "evt_1", "name", "Baseline Visit")));

        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration(objectMapper.writeValueAsString(existingConfig));

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        Map<String, Object> components = Map.of(
                "statuses", List.of(
                        Map.of("name", "Screening Pass", "statusCategory", "Generic/Screening")
                )
        );

        Map<String, Object> result = configurationService.importComponentsIntoExistingStudy(tenantId, studyId, components);

        assertEquals(1, result.get("importedCount"));
        ArgumentCaptor<StudyRequirement> captor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(captor.capture());

        StudyRequirement saved = captor.getValue();
        Map<String, Object> updatedConfig = objectMapper.readValue(saved.getConfiguration(), new TypeReference<Map<String, Object>>() {});

        // Unrelated configurations preserved intact
        assertTrue(updatedConfig.containsKey("studyGroups"));
        assertTrue(updatedConfig.containsKey("events"));
        assertEquals(1, ((List<?>) updatedConfig.get("studyGroups")).size());
        assertEquals(1, ((List<?>) updatedConfig.get("events")).size());

        // Target category updated
        assertTrue(updatedConfig.containsKey("statuses"));
        assertEquals(1, ((List<?>) updatedConfig.get("statuses")).size());
    }

    @Test
    void importComponents_batchDuplicateNames_deduplicatesGracefully() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        Map<String, Object> components = Map.of(
                "statuses", List.of(
                        Map.of("name", "Duplicate Status", "order", 1),
                        Map.of("name", "Duplicate Status", "order", 2),
                        Map.of("name", "Unique Status", "order", 3)
                )
        );

        Map<String, Object> result = configurationService.importComponentsIntoExistingStudy(tenantId, studyId, components);

        assertEquals(2, result.get("importedCount"));
        ArgumentCaptor<StudyRequirement> captor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(captor.capture());

        Map<String, Object> updatedConfig = objectMapper.readValue(
                captor.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> statuses = (List<?>) updatedConfig.get("statuses");
        assertEquals(2, statuses.size());
    }

    @Test
    void importComponents_duplicateAgainstExisting_reusesExistingIdWithoutDuplicate() throws Exception {
        Map<String, Object> existingConfig = new LinkedHashMap<>();
        existingConfig.put("statuses", List.of(Map.of("_id", "stat_existing_123", "name", "Pre-Screen")));

        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration(objectMapper.writeValueAsString(existingConfig));

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        Map<String, Object> components = Map.of(
                "statuses", List.of(
                        Map.of("_id", "stat_incoming_999", "name", "Pre-Screen")
                )
        );

        Map<String, Object> result = configurationService.importComponentsIntoExistingStudy(tenantId, studyId, components);

        assertEquals(0, result.get("importedCount"));
        ArgumentCaptor<StudyRequirement> captor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(captor.capture());

        Map<String, Object> updatedConfig = objectMapper.readValue(
                captor.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> statuses = (List<?>) updatedConfig.get("statuses");
        assertEquals(1, statuses.size());
        assertEquals("stat_existing_123", ((Map<?, ?>) statuses.get(0)).get("_id"));
    }

    @Test
    void importComponents_remapsDependentIdsInScheduledActionsAndSurveys() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        String oldEmailTemplateId = "tmpl_old_111";
        String oldEventTriggerId = "evt_old_222";
        String oldVarId = "var_old_333";

        Map<String, Object> components = Map.of(
                "emailTemplates", List.of(
                        Map.of("_id", oldEmailTemplateId, "name", "Welcome Email", "body", "Welcome")
                ),
                "events", List.of(
                        Map.of("_id", oldEventTriggerId, "name", "Initial Visit", "eventIndex", 1)
                ),
                "customVariables", List.of(
                        Map.of("_id", oldVarId, "name", "Age Group", "type", "text")
                ),
                "scheduledActions", List.of(
                        Map.of("name", "Send Welcome Action", "templateId", oldEmailTemplateId, "actionTriggerId", oldEventTriggerId)
                ),
                "surveys", List.of(
                        Map.of("name", "Intake Survey", "surveyJSON", "{\"questionVar\": \"" + oldVarId + "\"}")
                )
        );

        Map<String, Object> result = configurationService.importComponentsIntoExistingStudy(tenantId, studyId, components);

        assertEquals(5, result.get("importedCount"));
        ArgumentCaptor<StudyRequirement> captor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(captor.capture());

        Map<String, Object> updatedConfig = objectMapper.readValue(
                captor.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );

        List<?> emailTemplates = (List<?>) updatedConfig.get("emailTemplates");
        String newEmailTemplateId = (String) ((Map<?, ?>) emailTemplates.get(0)).get("_id");
        assertNotEquals(oldEmailTemplateId, newEmailTemplateId);

        List<?> events = (List<?>) updatedConfig.get("events");
        String newEventTriggerId = (String) ((Map<?, ?>) events.get(0)).get("_id");
        assertNotEquals(oldEventTriggerId, newEventTriggerId);

        List<?> customVariables = (List<?>) updatedConfig.get("customVariables");
        String newVarId = (String) ((Map<?, ?>) customVariables.get(0)).get("_id");
        assertNotEquals(oldVarId, newVarId);

        List<?> scheduledActions = (List<?>) updatedConfig.get("scheduledActions");
        Map<?, ?> action = (Map<?, ?>) scheduledActions.get(0);
        assertEquals(newEmailTemplateId, action.get("templateId"));
        assertEquals(newEventTriggerId, action.get("actionTriggerId"));

        List<?> surveys = (List<?>) updatedConfig.get("surveys");
        Map<?, ?> survey = (Map<?, ?>) surveys.get(0);
        String surveyJson = (String) survey.get("surveyJSON");
        assertTrue(surveyJson.contains(newVarId));
        assertFalse(surveyJson.contains(oldVarId));
    }

    // =========================================================================
    // Display Settings Tests
    // =========================================================================

    @Test
    void localeSupport_validAndInvalidCases() {
        assertTrue(configurationService.isLocaleSupported("en-US"));
        assertTrue(configurationService.isLocaleSupported("en-GB"));
        assertTrue(configurationService.isLocaleSupported("de"));
        assertTrue(configurationService.isLocaleSupported("ja"));
        assertFalse(configurationService.isLocaleSupported("invalid-locale"));
        assertFalse(configurationService.isLocaleSupported(null));
        assertFalse(configurationService.isLocaleSupported("   "));

        List<LocaleOptionDto> supported = configurationService.getSupportedLocales();
        assertNotNull(supported);
        assertTrue(supported.size() >= 30);
    }

    @Test
    void getDisplayConfiguration_defaultsWhenNoRequirementExists() {
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.empty());

        StudyDisplaySettingsResponse resp = configurationService.getDisplayConfiguration(
                tenantId,
                studyId,
                "en-US",
                false,
                false,
                true
        );

        assertNotNull(resp);
        assertEquals("en-US", resp.getLocale());
        assertFalse(resp.isShowGlobalComments());
        assertFalse(resp.isDefaultGlobalLogs());
        assertFalse(resp.isStatusPageCombinedView());
        assertTrue(resp.isEnrolledParticipantColumnsShowEvents());
        assertEquals(6, resp.getPotentialParticipantColumns().size());
        assertEquals(3, resp.getEnrolledParticipantColumns().size());
        assertTrue(resp.isCanManage());
    }

    @Test
    void updateDisplayCustomizations_emptyColumns_throwsInvalidStudyException() {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        UpdateStudyDisplaySettingsRequest request = new UpdateStudyDisplaySettingsRequest();
        request.setPotentialParticipantColumns(Collections.emptyList());

        InvalidStudyException ex = assertThrows(
                InvalidStudyException.class,
                () -> configurationService.updateDisplayCustomizationsInConfig(tenantId, studyId, request)
        );
        assertEquals("Must have at least one column for display.", ex.getMessage());
    }

    @Test
    void updateDisplayCustomizations_unsupportedColumn_throwsInvalidStudyException() {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        UpdateStudyDisplaySettingsRequest request = new UpdateStudyDisplaySettingsRequest();
        request.setPotentialParticipantColumns(List.of(
                new ParticipantColumnDto("Fake Column", "unsupported.col.value")
        ));

        assertThrows(
                InvalidStudyException.class,
                () -> configurationService.updateDisplayCustomizationsInConfig(tenantId, studyId, request)
        );
    }

    @Test
    void updateDisplayCustomizations_validColumns_persistsDisplaySettings() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        UpdateStudyDisplaySettingsRequest request = new UpdateStudyDisplaySettingsRequest();
        request.setStatusPageCombinedView(true);
        request.setEnrolledParticipantColumnsShowEvents(false);
        request.setPotentialParticipantColumns(List.of(
                new ParticipantColumnDto("ID", "psi.customId"),
                new ParticipantColumnDto("Name", "p.name")
        ));
        request.setEnrolledParticipantColumns(List.of(
                new ParticipantColumnDto("ID", "psi.customId")
        ));

        configurationService.updateDisplayCustomizationsInConfig(tenantId, studyId, request);

        ArgumentCaptor<StudyRequirement> captor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(captor.capture());

        Map<String, Object> updated = objectMapper.readValue(
                captor.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        assertTrue(updated.containsKey("displaySettings"));
        Map<?, ?> ds = (Map<?, ?>) updated.get("displaySettings");
        assertEquals(true, ds.get("statusPageCombinedView"));
        assertEquals(false, ds.get("enrolledParticipantColumnsShowEvents"));
        assertEquals(2, ((List<?>) ds.get("potentialParticipantColumns")).size());
        assertEquals(1, ((List<?>) ds.get("enrolledParticipantColumns")).size());
    }

    // =========================================================================
    // Bulk Tasks Tests
    // =========================================================================

    @Test
    void bulkTasks_createGroupAndCascadeDeleteTasks() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        // 1. Create Group
        SaveBulkTaskGroupRequest groupReq = new SaveBulkTaskGroupRequest();
        groupReq.setName("Follow-up Tasks");
        groupReq.setDescription("Post-screening tasks");
        groupReq.setTriggerActive(false);

        configurationService.createBulkTaskGroup(tenantId, studyId, groupReq);

        ArgumentCaptor<StudyRequirement> captor1 = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captor1.capture());
        StudyRequirement savedReq1 = captor1.getValue();

        Map<String, Object> config1 = objectMapper.readValue(
                savedReq1.getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> groups1 = (List<?>) config1.get("bulkTaskGroups");
        assertEquals(1, groups1.size());
        String createdGroupId = (String) ((Map<?, ?>) groups1.get(0)).get("_id");
        assertEquals("Follow-up Tasks", ((Map<?, ?>) groups1.get(0)).get("name"));

        // 2. Create Task in that group
        existing.setConfiguration(savedReq1.getConfiguration());
        SaveBulkTaskRequest taskReq = new SaveBulkTaskRequest();
        taskReq.setName("Send Lab Results");
        taskReq.setDescription("Upload to portal");
        taskReq.setAssignedTo(List.of("user_123"));

        configurationService.createBulkTask(tenantId, studyId, createdGroupId, taskReq);

        ArgumentCaptor<StudyRequirement> captor2 = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captor2.capture());
        StudyRequirement savedReq2 = captor2.getValue();

        Map<String, Object> config2 = objectMapper.readValue(
                savedReq2.getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> tasks2 = (List<?>) config2.get("bulkTasks");
        assertEquals(1, tasks2.size());
        Map<?, ?> taskMap = (Map<?, ?>) tasks2.get(0);
        assertEquals("Send Lab Results", taskMap.get("name"));
        assertEquals(0, ((Number) taskMap.get("rank")).intValue());
        assertEquals(createdGroupId, taskMap.get("bulkTaskGroupId"));

        // 3. Delete Group -> Cascades and deletes all tasks belonging to that group
        existing.setConfiguration(savedReq2.getConfiguration());
        configurationService.deleteBulkTaskGroup(tenantId, studyId, createdGroupId);

        ArgumentCaptor<StudyRequirement> captor3 = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captor3.capture());
        StudyRequirement savedReq3 = captor3.getValue();

        Map<String, Object> config3 = objectMapper.readValue(
                savedReq3.getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> groups3 = (List<?>) config3.get("bulkTaskGroups");
        List<?> tasks3 = (List<?>) config3.get("bulkTasks");
        assertEquals(0, groups3.size());
        assertEquals(0, tasks3.size());
    }

    @Test
    void bulkTasks_reorderTasks_updatesRanksAccurately() throws Exception {
        Map<String, Object> initialConfig = new LinkedHashMap<>();
        initialConfig.put("bulkTaskGroups", List.of(
                Map.of("_id", "grp_100", "name", "General Group")
        ));
        initialConfig.put("bulkTasks", new ArrayList<>(List.of(
                new LinkedHashMap<>(Map.of("_id", "t_1", "bulkTaskGroupId", "grp_100", "name", "Task 1", "rank", 0)),
                new LinkedHashMap<>(Map.of("_id", "t_2", "bulkTaskGroupId", "grp_100", "name", "Task 2", "rank", 1)),
                new LinkedHashMap<>(Map.of("_id", "t_3", "bulkTaskGroupId", "grp_100", "name", "Task 3", "rank", 2))
        )));

        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration(objectMapper.writeValueAsString(initialConfig));

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        // Reorder: t_3 first, then t_1, then t_2
        configurationService.reorderBulkTasks(tenantId, studyId, "grp_100", List.of("t_3", "t_1", "t_2"));

        ArgumentCaptor<StudyRequirement> captor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository).save(captor.capture());

        Map<String, Object> updated = objectMapper.readValue(
                captor.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> tasks = (List<?>) updated.get("bulkTasks");
        for (Object obj : tasks) {
            Map<?, ?> m = (Map<?, ?>) obj;
            String id = (String) m.get("_id");
            int rank = ((Number) m.get("rank")).intValue();
            if ("t_3".equals(id)) assertEquals(0, rank);
            if ("t_1".equals(id)) assertEquals(1, rank);
            if ("t_2".equals(id)) assertEquals(2, rank);
        }
    }

    // =========================================================================
    // Email and Text Templates Tests
    // =========================================================================

    @Test
    void emailTemplates_createUpdateCopyArchiveRestoreDeleteWorkflow() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        // 1. Create Email Template with Scheduled Action
        SaveEmailTemplateRequest createReq = new SaveEmailTemplateRequest();
        createReq.setName("Consent Confirmation");
        createReq.setSubject("Your Consent Confirmation");
        createReq.setDescription("Automated confirmation after consent");
        createReq.setMessage("Hello {{firstName}}, welcome to {{studyName}}.");
        createReq.setReplyTo("study@clinic.org");

        StudyScheduledActionDto sa = new StudyScheduledActionDto();
        StudyScheduledActionDto.ActionDetailsDto action = new StudyScheduledActionDto.ActionDetailsDto();
        action.setActionType("email");
        action.setActionTriggerType("event");
        action.setActionTriggerId("evt_screening");
        sa.setAction(action);
        StudyScheduledActionDto.ScheduleInformationDto schedule = new StudyScheduledActionDto.ScheduleInformationDto();
        schedule.setRelativeInterval(1);
        schedule.setRelativeUnit("days");
        schedule.setRelativeBeforeOrAfter("before");
        schedule.setDateType("scheduled");
        sa.setSchedule(schedule);
        createReq.setScheduledAction(sa);

        configurationService.createEmailTemplate(tenantId, studyId, createReq);

        ArgumentCaptor<StudyRequirement> captor1 = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captor1.capture());
        StudyRequirement saved1 = captor1.getValue();

        Map<String, Object> config1 = objectMapper.readValue(
                saved1.getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> emailTemplates1 = (List<?>) config1.get("emailTemplates");
        List<?> scheduledActions1 = (List<?>) config1.get("scheduledActions");
        assertEquals(1, emailTemplates1.size());
        assertEquals(1, scheduledActions1.size());

        Map<?, ?> createdTemplate = (Map<?, ?>) emailTemplates1.get(0);
        String createdTemplateId = (String) createdTemplate.get("_id");
        assertEquals("Consent Confirmation", createdTemplate.get("name"));
        assertEquals(false, createdTemplate.get("archived"));
        assertEquals(0, ((Number) createdTemplate.get("rank")).intValue());

        // 2. Reject duplicate active email template name
        existing.setConfiguration(saved1.getConfiguration());
        SaveEmailTemplateRequest dupReq = new SaveEmailTemplateRequest();
        dupReq.setName("consent confirmation"); // case-insensitive check
        dupReq.setSubject("Duplicate");
        dupReq.setMessage("Test");
        assertThrows(InvalidStudyException.class, () ->
                configurationService.createEmailTemplate(tenantId, studyId, dupReq));

        // 3. Copy Email Template
        configurationService.copyEmailTemplate(tenantId, studyId, createdTemplateId);
        ArgumentCaptor<StudyRequirement> captorCopy = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captorCopy.capture());
        Map<String, Object> configCopy = objectMapper.readValue(
                captorCopy.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> emailTemplatesCopy = (List<?>) configCopy.get("emailTemplates");
        assertEquals(2, emailTemplatesCopy.size());
        Map<?, ?> copiedTemplate = (Map<?, ?>) emailTemplatesCopy.get(1);
        assertEquals("Copy of Consent Confirmation", copiedTemplate.get("name"));

        // 4. Archive Email Template
        existing.setConfiguration(captorCopy.getValue().getConfiguration());
        configurationService.archiveEmailTemplate(tenantId, studyId, createdTemplateId);
        ArgumentCaptor<StudyRequirement> captorArch = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captorArch.capture());
        Map<String, Object> configArch = objectMapper.readValue(
                captorArch.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> emailTemplatesArch = (List<?>) configArch.get("emailTemplates");
        Map<?, ?> archT = (Map<?, ?>) emailTemplatesArch.get(0);
        assertEquals(true, archT.get("archived"));

        // 5. Restore Email Template
        existing.setConfiguration(captorArch.getValue().getConfiguration());
        configurationService.restoreEmailTemplate(tenantId, studyId, createdTemplateId);
        ArgumentCaptor<StudyRequirement> captorRest = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captorRest.capture());
        Map<String, Object> configRest = objectMapper.readValue(
                captorRest.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> emailTemplatesRest = (List<?>) configRest.get("emailTemplates");
        Map<?, ?> restT = (Map<?, ?>) emailTemplatesRest.get(0);
        assertEquals(false, restT.get("archived"));

        // 6. Delete Email Template -> Removes template and any attached scheduled action
        existing.setConfiguration(captorRest.getValue().getConfiguration());
        configurationService.deleteEmailTemplate(tenantId, studyId, createdTemplateId);
        ArgumentCaptor<StudyRequirement> captorDel = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captorDel.capture());
        Map<String, Object> configDel = objectMapper.readValue(
                captorDel.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> emailTemplatesDel = (List<?>) configDel.get("emailTemplates");
        assertEquals(1, emailTemplatesDel.size()); // only copy remains
        assertFalse(((Map<?, ?>) emailTemplatesDel.get(0)).get("_id").equals(createdTemplateId));
    }

    @Test
    void textTemplates_enforce1600CharLimitAndCrud() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        // 1. Text message > 1600 chars throws InvalidStudyException
        SaveTextTemplateRequest tooLongReq = new SaveTextTemplateRequest();
        tooLongReq.setName("Long SMS");
        tooLongReq.setMessage("A".repeat(1601));
        assertThrows(InvalidStudyException.class, () ->
                configurationService.createTextTemplate(tenantId, studyId, tooLongReq));

        // 2. Valid text message succeeds
        SaveTextTemplateRequest validReq = new SaveTextTemplateRequest();
        validReq.setName("Appointment Reminder");
        validReq.setDescription("SMS 24h prior");
        validReq.setMessage("Hi {{firstName}}, your study visit is tomorrow at 10 AM.");

        configurationService.createTextTemplate(tenantId, studyId, validReq);

        ArgumentCaptor<StudyRequirement> captor = ArgumentCaptor.forClass(StudyRequirement.class);
        verify(studyRequirementRepository, atLeastOnce()).save(captor.capture());
        Map<String, Object> config = objectMapper.readValue(
                captor.getValue().getConfiguration(),
                new TypeReference<Map<String, Object>>() {}
        );
        List<?> texts = (List<?>) config.get("textTemplates");
        assertEquals(1, texts.size());
        Map<?, ?> textMap = (Map<?, ?>) texts.get(0);
        assertEquals("Appointment Reminder", textMap.get("name"));
        assertEquals(0, ((Number) textMap.get("rank")).intValue());
    }

    @Test
    void getStudyRequirements_retrievesAllSectionsCorrectly() {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setSampleSize(150);
        existing.setConfiguration("{" +
                "\"groups\":[{\"_id\":\"age_1\",\"name\":\"Pediatric\",\"sample\":50,\"minAge\":1,\"maxAge\":12,\"ageGroup\":\"years\"}]," +
                "\"genderGroups\":[{\"_id\":\"gen_1\",\"name\":\"Female\",\"sample\":75}]," +
                "\"customVariables\":[{\"_id\":\"var_1\",\"name\":\"Handedness\",\"type\":\"single\",\"isGlobal\":false,\"options\":[{\"label\":\"Right\",\"value\":\"right\"}]}]," +
                "\"variableGroups\":[{\"_id\":\"grp_1\",\"name\":\"Neurological Markers\"}]," +
                "\"layout\":[{\"id\":\"var_1\",\"type\":\"variable\"}]" +
                "}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyMilestoneRepository.findByTenantIdAndStudyIdOrderByMilestoneDateAsc(tenantId, studyId)).thenReturn(Collections.emptyList());

        StudyRequirementsResponse res = configurationService.getStudyRequirements(tenantId, studyId, true);

        assertNotNull(res);
        assertEquals(studyId.toString(), res.getStudyId());
        assertEquals(150, res.getSampleSize());
        assertEquals(2, res.getStudyGroups().size()); // Pediatric (age) + Female (sex)
        assertEquals("Pediatric", res.getStudyGroups().get(0).getLabel());
        assertEquals(1, res.getCustomVariables().size());
        assertEquals("Handedness", res.getCustomVariables().get(0).getName());
        assertEquals(1, res.getVariableGroups().size());
        assertEquals(1, res.getCustomVariableLayout().size());
    }

    @Test
    void updateStudyRequirements_persistsAllSectionsCorrectly() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setSampleSize(50);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRequirementRepository.save(any(StudyRequirement.class))).thenAnswer(i -> i.getArgument(0));

        UpdateStudyRequirementsRequest req = new UpdateStudyRequirementsRequest();
        req.setSampleSize(250);

        DemographicGroupDto ageGrp = new DemographicGroupDto();
        ageGrp.setLabel("Adults");
        ageGrp.setSampleSize("100");
        ageGrp.setDefaultCategoryName("age");
        ageGrp.setAgeRange(new DemographicGroupDto.AgeRangeDto(18, 65));
        req.setStudyGroups(List.of(ageGrp));

        StudyCustomVariableDto varDto = new StudyCustomVariableDto();
        varDto.setName("Blood Pressure");
        varDto.setVariableType("text");
        varDto.setGlobal(true);
        req.setCustomVariables(List.of(varDto));

        StudyRequirementsResponse updated = configurationService.updateStudyRequirements(tenantId, studyId, req, true);

        assertNotNull(updated);
        assertEquals(250, updated.getSampleSize());
        assertEquals(1, updated.getStudyGroups().size());
        assertEquals("Adults", updated.getStudyGroups().get(0).getLabel());
        assertEquals(1, updated.getCustomVariables().size());
        assertEquals("Blood Pressure", updated.getCustomVariables().get(0).getName());
        assertTrue(updated.getCustomVariables().get(0).isGlobal());
    }

    @Test
    void milestoneManagement_addUpdateDelete() {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setConfiguration("{}");
        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));

        StudyMilestone m1 = new StudyMilestone();
        UUID milestoneId = UUID.randomUUID();
        m1.setId(milestoneId);
        m1.setTenantId(tenantId);
        m1.setStudyId(studyId);
        m1.setParticipantTarget(75);

        when(studyMilestoneRepository.save(any(StudyMilestone.class))).thenReturn(m1);
        when(studyMilestoneRepository.findByTenantIdAndStudyIdAndId(tenantId, studyId, milestoneId)).thenReturn(Optional.of(m1));

        StudyMilestoneDto dto = new StudyMilestoneDto();
        dto.setParticipantTarget(75);
        dto.setMilestoneDate("2026-12-31");

        StudyMilestoneDto added = configurationService.addStudyMilestone(tenantId, studyId, dto);
        assertNotNull(added);
        assertEquals(75, added.getParticipantTarget());

        dto.setParticipantTarget(90);
        dto.setDescription("Updated Phase 1 Milestone");
        dto.setMilestoneDate("2027-01-15");
        StudyMilestoneDto updated = configurationService.updateStudyMilestone(tenantId, studyId, milestoneId.toString(), dto);
        assertNotNull(updated);
        assertEquals(90, m1.getParticipantTarget());
        assertEquals("Updated Phase 1 Milestone", m1.getDescription());

        configurationService.deleteStudyMilestone(tenantId, studyId, milestoneId.toString());
        verify(studyMilestoneRepository).delete(m1);
    }

    @Test
    void updateStudyRequirements_explicitNullSampleSizeClearsSampleSize() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setSampleSize(500);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRequirementRepository.save(any(StudyRequirement.class))).thenAnswer(i -> i.getArgument(0));

        // Explicit null in JSON: {"sampleSize": null}
        UpdateStudyRequirementsRequest req = objectMapper.readValue("{\"sampleSize\": null}", UpdateStudyRequirementsRequest.class);
        assertTrue(req.isSampleSizeSet());
        assertNull(req.getSampleSize());

        StudyRequirementsResponse res = configurationService.updateStudyRequirements(tenantId, studyId, req, true);

        assertNotNull(res);
        assertNull(res.getSampleSize());
        assertNull(existing.getSampleSize());
    }

    @Test
    void updateStudyRequirements_omittedSampleSizePreservesExistingSampleSize() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setSampleSize(350);
        existing.setConfiguration("{}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRequirementRepository.save(any(StudyRequirement.class))).thenAnswer(i -> i.getArgument(0));

        // Omitted sampleSize in JSON: {"studyGroups": []}
        UpdateStudyRequirementsRequest req = objectMapper.readValue("{\"studyGroups\": []}", UpdateStudyRequirementsRequest.class);
        assertFalse(req.isSampleSizeSet());

        StudyRequirementsResponse res = configurationService.updateStudyRequirements(tenantId, studyId, req, true);

        assertNotNull(res);
        assertEquals(350, res.getSampleSize());
        assertEquals(350, existing.getSampleSize());
    }

    @Test
    void updateStudyRequirements_partialUpdatePreservesUnrelatedSections() throws Exception {
        StudyRequirement existing = new StudyRequirement();
        existing.setTenantId(tenantId);
        existing.setStudyId(studyId);
        existing.setSampleSize(200);
        existing.setConfiguration("{" +
                "\"customVariables\":[{\"_id\":\"var_preserved\",\"name\":\"Preserved Variable\",\"type\":\"text\",\"isGlobal\":true}]," +
                "\"variableGroups\":[{\"_id\":\"grp_preserved\",\"name\":\"Preserved Group\",\"members\":[\"var_preserved\"]}]," +
                "\"layout\":[{\"id\":\"var_preserved\",\"type\":\"variable\",\"rank\":0}]" +
                "}");

        when(studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRequirementRepository.save(any(StudyRequirement.class))).thenAnswer(i -> i.getArgument(0));

        // Update ONLY studyGroups
        DemographicGroupDto newGroup = new DemographicGroupDto();
        newGroup.setLabel("Youth");
        newGroup.setDefaultCategoryName("age");
        newGroup.setSampleSize("50");

        UpdateStudyRequirementsRequest req = new UpdateStudyRequirementsRequest();
        req.setStudyGroups(List.of(newGroup));

        StudyRequirementsResponse res = configurationService.updateStudyRequirements(tenantId, studyId, req, true);

        assertNotNull(res);
        // Study groups updated
        assertEquals(1, res.getStudyGroups().size());
        assertEquals("Youth", res.getStudyGroups().get(0).getLabel());

        // Sample size preserved
        assertEquals(200, res.getSampleSize());

        // Custom variables preserved
        assertEquals(1, res.getCustomVariables().size());
        assertEquals("Preserved Variable", res.getCustomVariables().get(0).getName());

        // Variable groups preserved
        assertEquals(1, res.getVariableGroups().size());
        assertEquals("Preserved Group", res.getVariableGroups().get(0).getName());

        // Layout preserved
        assertEquals(1, res.getCustomVariableLayout().size());
    }

    @Test
    void deserializeUpdateStudyRequirementsRequest_withVariableOptionsHavingOrder_succeeds() throws Exception {
        String json = "{\n" +
                "  \"customVariables\": [\n" +
                "    {\n" +
                "      \"id\": \"var_12345\",\n" +
                "      \"name\": \"MyLocalGlobal\",\n" +
                "      \"variableType\": \"single\",\n" +
                "      \"options\": [\n" +
                "        { \"label\": \"test\", \"value\": \"test\", \"order\": 0 },\n" +
                "        { \"label\": \"NotValid\", \"value\": \"notvalid\", \"order\": 1 }\n" +
                "      ],\n" +
                "      \"isGlobal\": true,\n" +
                "      \"isBlind\": false,\n" +
                "      \"rank\": 0\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        UpdateStudyRequirementsRequest req = objectMapper.readValue(json, UpdateStudyRequirementsRequest.class);
        assertNotNull(req.getCustomVariables());
        assertEquals(1, req.getCustomVariables().size());
        StudyCustomVariableDto var = req.getCustomVariables().get(0);
        assertEquals("MyLocalGlobal", var.getName());
        assertEquals(2, var.getOptions().size());
        assertEquals(0, var.getOptions().get(0).getOrder());
        assertEquals("test", var.getOptions().get(0).getName());
        assertEquals("test", var.getOptions().get(0).getOptionId());
        assertEquals(1, var.getOptions().get(1).getOrder());
    }
}
