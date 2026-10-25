package com.enrollnow.study.services;

import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.StudyRequirement;
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

    private final ObjectMapper objectMapper = new ObjectMapper();
    private StudyConfigurationService configurationService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        configurationService = new StudyConfigurationService(studyRequirementRepository, objectMapper);
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
}
