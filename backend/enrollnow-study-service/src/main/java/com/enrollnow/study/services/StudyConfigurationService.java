package com.enrollnow.study.services;

import com.enrollnow.study.dtos.ImportStudyResponse;
import com.enrollnow.study.dtos.LocaleOptionDto;
import com.enrollnow.study.dtos.ParticipantColumnDto;
import com.enrollnow.study.dtos.SaveBulkTaskGroupRequest;
import com.enrollnow.study.dtos.SaveBulkTaskRequest;
import com.enrollnow.study.dtos.StudyAdminSummary;
import com.enrollnow.study.dtos.StudyBulkTasksResponse;
import com.enrollnow.study.dtos.StudyDisplaySettingsResponse;
import com.enrollnow.study.dtos.SaveEmailTemplateRequest;
import com.enrollnow.study.dtos.SaveTextTemplateRequest;
import com.enrollnow.study.dtos.StudyEmailTemplateDto;
import com.enrollnow.study.dtos.StudyEmailTextSettingsResponse;
import com.enrollnow.study.dtos.StudyScheduledActionDto;
import com.enrollnow.study.dtos.StudyTextTemplateDto;
import com.enrollnow.study.dtos.UpdateStudyDisplaySettingsRequest;
import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.dtos.ContactTaxonomyDto;
import com.enrollnow.study.dtos.DemographicGroupDto;
import com.enrollnow.study.dtos.StudyCustomVariableDto;
import com.enrollnow.study.dtos.StudyLayoutItemDto;
import com.enrollnow.study.dtos.StudyMilestoneDto;
import com.enrollnow.study.dtos.StudyRequirementsResponse;
import com.enrollnow.study.dtos.StudyVariableGroupDto;
import com.enrollnow.study.dtos.UpdateStudyRequirementsRequest;
import com.enrollnow.study.models.StudyMilestone;
import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.repositories.StudyMilestoneRepository;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class StudyConfigurationService {

    private static final Logger log = LoggerFactory.getLogger(StudyConfigurationService.class);

    private final StudyRequirementRepository studyRequirementRepository;
    private final ObjectMapper objectMapper;
    private StudyMilestoneRepository studyMilestoneRepository;

    public StudyConfigurationService(
            StudyRequirementRepository studyRequirementRepository,
            ObjectMapper objectMapper
    ) {
        this(studyRequirementRepository, objectMapper, null);
    }

    @Autowired
    public StudyConfigurationService(
            StudyRequirementRepository studyRequirementRepository,
            ObjectMapper objectMapper,
            @Autowired(required = false) StudyMilestoneRepository studyMilestoneRepository
    ) {
        this.studyRequirementRepository = studyRequirementRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.studyMilestoneRepository = studyMilestoneRepository;
    }

    @Autowired(required = false)
    public void setStudyMilestoneRepository(StudyMilestoneRepository studyMilestoneRepository) {
        this.studyMilestoneRepository = studyMilestoneRepository;
    }

    @Transactional
    public StudyRequirement createDefaultConfiguration(UUID tenantId, UUID studyId, Integer sampleSize) {
        int targetSample = (sampleSize != null && sampleSize > 0) ? sampleSize : 100;

        String enrolledStatusId = "stat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String potentialStatusId = "stat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        Map<String, Object> enrolledStatus = new LinkedHashMap<>();
        enrolledStatus.put("_id", enrolledStatusId);
        enrolledStatus.put("name", "Enrolled Participants");
        enrolledStatus.put("potential", false);
        enrolledStatus.put("rank", 0);
        enrolledStatus.put("statusCategory", "Generic/Completed");
        enrolledStatus.put("studyId", studyId.toString());

        Map<String, Object> potentialStatus = new LinkedHashMap<>();
        potentialStatus.put("_id", potentialStatusId);
        potentialStatus.put("name", "Potential Participants");
        potentialStatus.put("potential", true);
        potentialStatus.put("rank", 0);
        potentialStatus.put("statusCategory", "Generic/Screening");
        potentialStatus.put("studyId", studyId.toString());

        List<Map<String, Object>> statuses = List.of(enrolledStatus, potentialStatus);

        List<Map<String, Object>> groups = new ArrayList<>();
        Map<String, Object> entireSample = new LinkedHashMap<>();
        entireSample.put("_id", "grp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        entireSample.put("defaultCategoryName", "age");
        entireSample.put("label", "Entire Sample");
        entireSample.put("ageRange", Map.of("min", 1, "max", 100));
        entireSample.put("studyId", studyId.toString());
        groups.add(entireSample);

        for (String gender : List.of("Female", "Male", "Other")) {
            Map<String, Object> g = new LinkedHashMap<>();
            g.put("_id", "grp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            g.put("defaultCategoryName", "sex");
            g.put("label", gender);
            g.put("studyId", studyId.toString());
            groups.add(g);
        }

        for (String eth : List.of("Hispanic or Latino", "Not Hispanic or Latino")) {
            Map<String, Object> g = new LinkedHashMap<>();
            g.put("_id", "grp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            g.put("defaultCategoryName", "ethnicity");
            g.put("label", eth);
            g.put("studyId", studyId.toString());
            groups.add(g);
        }

        for (String race : List.of("American Indian", "Asian", "Hawaiian", "Black / African American", "White")) {
            Map<String, Object> g = new LinkedHashMap<>();
            g.put("_id", "grp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            g.put("defaultCategoryName", "race");
            g.put("label", race);
            g.put("studyId", studyId.toString());
            groups.add(g);
        }

        Map<String, Object> intakeEvent = new LinkedHashMap<>();
        String intakeEventId = "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        intakeEvent.put("_id", intakeEventId);
        intakeEvent.put("name", "Intake");
        intakeEvent.put("relative", false);
        intakeEvent.put("rank", 0);
        intakeEvent.put("statuses", List.of(enrolledStatusId, potentialStatusId));
        intakeEvent.put("studyId", studyId.toString());

        List<Map<String, Object>> events = List.of(intakeEvent);

        Map<String, Object> configMap = new LinkedHashMap<>();
        configMap.put("statuses", statuses);
        configMap.put("studyGroups", groups);
        configMap.put("events", events);
        configMap.put("customVariables", Collections.emptyList());
        configMap.put("bulkTaskGroups", Collections.emptyList());
        configMap.put("bulkTasks", Collections.emptyList());
        configMap.put("textTemplates", Collections.emptyList());
        configMap.put("emailTemplates", Collections.emptyList());
        configMap.put("scheduledActions", Collections.emptyList());
        configMap.put("surveys", Collections.emptyList());

        return saveStudyRequirement(tenantId, studyId, targetSample, configMap);
    }

    @Transactional
    public StudyRequirement cloneConfiguration(UUID tenantId, UUID sourceStudyId, UUID newStudyId, Integer sampleSize) {
        Optional<StudyRequirement> sourceOpt = studyRequirementRepository.findByTenantIdAndStudyId(tenantId, sourceStudyId);
        if (sourceOpt.isEmpty()) {
            return createDefaultConfiguration(tenantId, newStudyId, sampleSize);
        }

        StudyRequirement sourceReq = sourceOpt.get();
        int targetSample = (sampleSize != null && sampleSize > 0)
                ? sampleSize
                : (sourceReq.getSampleSize() != null ? sourceReq.getSampleSize() : 100);

        try {
            Map<String, Object> sourceConfig = objectMapper.readValue(
                    sourceReq.getConfiguration(),
                    new TypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> clonedConfig = processAndRemapConfiguration(
                    sourceConfig,
                    sourceStudyId.toString(),
                    newStudyId.toString()
            );

            return saveStudyRequirement(tenantId, newStudyId, targetSample, clonedConfig);
        } catch (Exception ex) {
            log.warn("Failed to clone study configuration from source {}, creating default configuration instead: {}",
                    sourceStudyId, ex.getMessage());
            return createDefaultConfiguration(tenantId, newStudyId, targetSample);
        }
    }

    @Transactional
    public ImportStudyResponse importLegacyStudyConfiguration(
            UUID tenantId,
            UUID newStudyId,
            String newStudyCode,
            String studyName,
            Map<String, Object> dataJSON
    ) {
        int sampleSize = 100;
        if (dataJSON.get("studyRequirements") instanceof Map<?, ?> reqMap) {
            Object sSize = reqMap.get("sampleSize");
            if (sSize instanceof Number num) {
                sampleSize = num.intValue();
            }
        } else if (dataJSON.get("sampleSize") instanceof Number num) {
            sampleSize = num.intValue();
        }

        String originalStudyId = null;
        if (dataJSON.get("study") instanceof Map<?, ?> stMap && stMap.get("_id") != null) {
            originalStudyId = String.valueOf(stMap.get("_id"));
        } else if (dataJSON.get("studyId") != null) {
            originalStudyId = String.valueOf(dataJSON.get("studyId"));
        }
        if (originalStudyId == null) {
            originalStudyId = "studyId1";
        }

        Map<String, Object> remapped = processAndRemapConfiguration(dataJSON, originalStudyId, newStudyId.toString());

        saveStudyRequirement(tenantId, newStudyId, sampleSize, remapped);

        Map<String, Integer> summary = new LinkedHashMap<>();
        summary.put("statuses", getListSize(remapped, "statuses"));
        summary.put("studyGroups", getListSize(remapped, "studyGroups"));
        summary.put("customVariables", getListSize(remapped, "customVariables"));
        summary.put("events", getListSize(remapped, "events"));
        summary.put("bulkTaskGroups", getListSize(remapped, "bulkTaskGroups"));
        summary.put("bulkTasks", getListSize(remapped, "bulkTasks"));
        summary.put("textTemplates", getListSize(remapped, "textTemplates"));
        summary.put("emailTemplates", getListSize(remapped, "emailTemplates"));
        summary.put("surveys", getListSize(remapped, "surveys"));
        summary.put("scheduledActions", getListSize(remapped, "scheduledActions"));

        List<String> unsupported = new ArrayList<>();
        unsupported.add("Live participant records, responses, and activity history were omitted by design to preserve audit and tenant boundaries.");
        unsupported.add("Legacy AWS S3 raw survey file uploads converted to relational JSONB questionnaire structures.");

        return new ImportStudyResponse(
                newStudyId,
                newStudyCode,
                studyName,
                "Study successfully imported with " + summary.get("statuses") + " statuses, "
                        + summary.get("events") + " events, " + summary.get("studyGroups") + " groups, and "
                        + summary.get("surveys") + " surveys.",
                summary,
                unsupported
        );
    }

    private int getListSize(Map<String, Object> map, String key) {
        if (map.get(key) instanceof List<?> list) {
            return list.size();
        }
        return 0;
    }

    private Map<String, Object> processAndRemapConfiguration(
            Map<String, Object> source,
            String oldStudyId,
            String newStudyId
    ) {
        Map<String, Object> result = new LinkedHashMap<>(source);
        Map<String, String> idMap = new HashMap<>();

        // 1. Remap Custom Variables
        List<Map<String, Object>> newCustomVars = new ArrayList<>();
        List<?> rawCustomVars = (List<?>) source.get("customVariables");
        if (rawCustomVars != null) {
            for (Object obj : rawCustomVars) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> cv = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldCvId = String.valueOf(cv.get("_id") != null ? cv.get("_id") : cv.get("variableId"));
                    String newCvId = "cv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldCvId, newCvId);
                    cv.put("_id", newCvId);
                    cv.put("variableId", newCvId);

                    if (cv.get("options") instanceof List<?> rawOptions) {
                        List<Map<String, Object>> newOptions = new ArrayList<>();
                        for (Object optObj : rawOptions) {
                            if (optObj instanceof Map<?, ?> optMap) {
                                Map<String, Object> opt = new LinkedHashMap<>((Map<String, Object>) optMap);
                                String oldOptId = String.valueOf(opt.get("optionId"));
                                String newOptId = "opt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                                idMap.put(oldOptId, newOptId);
                                opt.put("optionId", newOptId);
                                newOptions.add(opt);
                            }
                        }
                        cv.put("options", newOptions);
                    }
                    newCustomVars.add(cv);
                }
            }
        }
        result.put("customVariables", newCustomVars);

        // 2. Remap Statuses
        List<Map<String, Object>> newStatuses = new ArrayList<>();
        List<?> rawStatuses = (List<?>) source.get("statuses");
        if (rawStatuses != null) {
            for (Object obj : rawStatuses) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> st = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldId = String.valueOf(st.get("_id"));
                    String newId = "stat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldId, newId);
                    st.put("_id", newId);
                    st.put("studyId", newStudyId);
                    newStatuses.add(st);
                }
            }
        }
        result.put("statuses", newStatuses);

        // 3. Remap Groups
        List<Map<String, Object>> newGroups = new ArrayList<>();
        List<?> rawGroups = (List<?>) (source.get("studyGroups") != null ? source.get("studyGroups") : source.get("groups"));
        if (rawGroups != null) {
            for (Object obj : rawGroups) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> grp = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldId = String.valueOf(grp.get("_id"));
                    String newId = "grp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldId, newId);
                    grp.put("_id", newId);
                    grp.put("studyId", newStudyId);
                    newGroups.add(grp);
                }
            }
        }
        result.put("studyGroups", newGroups);

        // 4. Remap Events
        List<Map<String, Object>> newEvents = new ArrayList<>();
        List<?> rawEvents = (List<?>) source.get("events");
        if (rawEvents != null) {
            for (Object obj : rawEvents) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> evt = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldId = String.valueOf(evt.get("_id"));
                    String newId = "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldId, newId);
                    evt.put("_id", newId);
                    evt.put("studyId", newStudyId);

                    if (evt.get("statuses") instanceof List<?> stList) {
                        List<String> remappedStatuses = new ArrayList<>();
                        for (Object s : stList) {
                            String sid = String.valueOf(s);
                            remappedStatuses.add(idMap.getOrDefault(sid, sid));
                        }
                        evt.put("statuses", remappedStatuses);
                    }
                    newEvents.add(evt);
                }
            }

            // Secondary pass for expectedDateCalculation.relativeEventId
            for (Map<String, Object> evt : newEvents) {
                if (evt.get("expectedDateCalculation") instanceof Map<?, ?> calcMap) {
                    Map<String, Object> mutableCalc = new LinkedHashMap<>((Map<String, Object>) calcMap);
                    if (mutableCalc.get("relativeEventId") != null) {
                        String oldRel = String.valueOf(mutableCalc.get("relativeEventId"));
                        mutableCalc.put("relativeEventId", idMap.getOrDefault(oldRel, oldRel));
                        evt.put("expectedDateCalculation", mutableCalc);
                    }
                }
            }
        }
        result.put("events", newEvents);

        // 5. Remap BulkTaskGroups and BulkTasks
        List<Map<String, Object>> newBTG = new ArrayList<>();
        List<?> rawBTG = (List<?>) source.get("bulkTaskGroups");
        if (rawBTG != null) {
            for (Object obj : rawBTG) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> btg = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldId = String.valueOf(btg.get("_id"));
                    String newId = "btg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldId, newId);
                    btg.put("_id", newId);
                    btg.put("studyId", newStudyId);

                    if (btg.get("trigger") instanceof Map<?, ?> trigMap) {
                        Map<String, Object> mutableTrig = new LinkedHashMap<>((Map<String, Object>) trigMap);
                        if (mutableTrig.get("eventId") != null) {
                            String oldEvtId = String.valueOf(mutableTrig.get("eventId"));
                            mutableTrig.put("eventId", idMap.getOrDefault(oldEvtId, oldEvtId));
                            btg.put("trigger", mutableTrig);
                        }
                    }
                    newBTG.add(btg);
                }
            }
        }
        result.put("bulkTaskGroups", newBTG);

        List<Map<String, Object>> newBT = new ArrayList<>();
        List<?> rawBT = (List<?>) source.get("bulkTasks");
        if (rawBT != null) {
            for (Object obj : rawBT) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> bt = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldBtgId = String.valueOf(bt.get("bulkTaskGroupId"));
                    bt.put("bulkTaskGroupId", idMap.getOrDefault(oldBtgId, oldBtgId));
                    bt.put("studyId", newStudyId);
                    newBT.add(bt);
                }
            }
        }
        result.put("bulkTasks", newBT);

        // 6. Remap TextTemplates and EmailTemplates
        List<Map<String, Object>> newTxtTemps = new ArrayList<>();
        List<?> rawTxtTemps = (List<?>) source.get("textTemplates");
        if (rawTxtTemps != null) {
            for (Object obj : rawTxtTemps) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> tt = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldId = String.valueOf(tt.get("_id"));
                    String newId = "txt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldId, newId);
                    tt.put("_id", newId);
                    tt.put("studyId", newStudyId);
                    newTxtTemps.add(tt);
                }
            }
        }
        result.put("textTemplates", newTxtTemps);

        List<Map<String, Object>> newEmailTemps = new ArrayList<>();
        List<?> rawEmailTemps = (List<?>) source.get("emailTemplates");
        if (rawEmailTemps != null) {
            for (Object obj : rawEmailTemps) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> et = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldId = String.valueOf(et.get("_id"));
                    String newId = "eml_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldId, newId);
                    et.put("_id", newId);
                    et.put("studyId", newStudyId);
                    newEmailTemps.add(et);
                }
            }
        }
        result.put("emailTemplates", newEmailTemps);

        // 7. Remap ScheduledActions
        List<Map<String, Object>> newActions = new ArrayList<>();
        List<?> rawActions = (List<?>) source.get("scheduledActions");
        if (rawActions != null) {
            for (Object obj : rawActions) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> sa = new LinkedHashMap<>((Map<String, Object>) origMap);
                    if (sa.get("templateId") != null) {
                        String oldTmplId = String.valueOf(sa.get("templateId"));
                        sa.put("templateId", idMap.getOrDefault(oldTmplId, oldTmplId));
                    }
                    if (sa.get("action") instanceof Map<?, ?> actMap) {
                        Map<String, Object> mutableAct = new LinkedHashMap<>((Map<String, Object>) actMap);
                        mutableAct.put("actionTriggerStudyId", newStudyId);
                        if (mutableAct.get("actionTriggerId") != null) {
                            String oldTrigId = String.valueOf(mutableAct.get("actionTriggerId"));
                            mutableAct.put("actionTriggerId", idMap.getOrDefault(oldTrigId, oldTrigId));
                        }
                        sa.put("action", mutableAct);
                    }
                    newActions.add(sa);
                }
            }
        }
        result.put("scheduledActions", newActions);

        // 8. Remap Surveys
        List<Map<String, Object>> newSurveys = new ArrayList<>();
        List<?> rawSurveys = (List<?>) source.get("surveys");
        if (rawSurveys != null) {
            for (Object obj : rawSurveys) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> srv = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String oldSrvId = String.valueOf(srv.get("_id") != null ? srv.get("_id") : srv.get("surveyId"));
                    String newSrvId = "srv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    idMap.put(oldSrvId, newSrvId);
                    srv.put("_id", newSrvId);
                    srv.put("studyId", newStudyId);

                    // Deep remap IDs within surveyJSON
                    if (srv.get("surveyJSON") != null) {
                        String srvJsonStr;
                        if (srv.get("surveyJSON") instanceof String str) {
                            srvJsonStr = str;
                        } else {
                            try {
                                srvJsonStr = objectMapper.writeValueAsString(srv.get("surveyJSON"));
                            } catch (Exception ignored) {
                                srvJsonStr = String.valueOf(srv.get("surveyJSON"));
                            }
                        }

                        for (Map.Entry<String, String> entry : idMap.entrySet()) {
                            srvJsonStr = srvJsonStr.replace(entry.getKey(), entry.getValue());
                        }
                        if (oldStudyId != null && !oldStudyId.isBlank()) {
                            srvJsonStr = srvJsonStr.replace(oldStudyId, newStudyId);
                        }
                        srv.put("surveyJSON", srvJsonStr);
                    }
                    newSurveys.add(srv);
                }
            }
        }
        result.put("surveys", newSurveys);

        // 9. Rewrite survey links in templates
        for (Map<String, Object> tt : newTxtTemps) {
            if (tt.get("message") instanceof String msg) {
                String rewritten = rewriteSurveyLinks(msg, oldStudyId, newStudyId, idMap);
                tt.put("message", rewritten);
            }
        }
        for (Map<String, Object> et : newEmailTemps) {
            if (et.get("message") instanceof String msg) {
                et.put("message", rewriteSurveyLinks(msg, oldStudyId, newStudyId, idMap));
            }
            if (et.get("design") instanceof String dsg) {
                et.put("design", rewriteSurveyLinks(dsg, oldStudyId, newStudyId, idMap));
            }
        }

        return result;
    }

    private String rewriteSurveyLinks(String content, String oldStudyId, String newStudyId, Map<String, String> idMap) {
        if (content == null || content.isEmpty()) {
            return content;
        }
        String updated = content;
        if (oldStudyId != null && !oldStudyId.isBlank()) {
            updated = updated.replace(oldStudyId, newStudyId);
        }
        for (Map.Entry<String, String> entry : idMap.entrySet()) {
            updated = updated.replace(entry.getKey(), entry.getValue());
        }
        return updated;
    }

    private StudyRequirement saveStudyRequirement(UUID tenantId, UUID studyId, Integer sampleSize, Map<String, Object> configMap) {
        String json;
        try {
            json = objectMapper.writeValueAsString(configMap);
        } catch (Exception ex) {
            json = "{}";
        }

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> {
                    StudyRequirement req = new StudyRequirement();
                    req.setStudyId(studyId);
                    req.setTenantId(tenantId);
                    return req;
                });

        if (sampleSize != null) {
            requirement.setSampleSize(sampleSize);
        }
        requirement.setConfiguration(json);
        requirement.setUpdatedAt(OffsetDateTime.now());

        return studyRequirementRepository.save(requirement);
    }

    @Transactional
    public Map<String, Object> importComponentsIntoExistingStudy(
            UUID tenantId,
            UUID studyId,
            Map<String, Object> components
    ) {
        if (components == null || components.isEmpty()) {
            return Map.of("importedCount", 0, "message", "No components selected to import.");
        }

        // Validate input data structure before persistence
        for (Map.Entry<String, Object> entry : components.entrySet()) {
            if (entry.getValue() != null && !(entry.getValue() instanceof List<?>)) {
                throw new InvalidStudyException("Category '" + entry.getKey() + "' must be a list of component objects.");
            }
            if (entry.getValue() instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null && !(item instanceof Map<?, ?>)) {
                        throw new InvalidStudyException("Malformed item in category '" + entry.getKey() + "': must be an object.");
                    }
                }
            }
        }

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study configuration not found for study: " + studyId));

        Map<String, Object> currentConfig;
        try {
            if (requirement.getConfiguration() != null && !requirement.getConfiguration().isBlank()) {
                currentConfig = objectMapper.readValue(requirement.getConfiguration(), new TypeReference<Map<String, Object>>() {});
            } else {
                currentConfig = new LinkedHashMap<>();
            }
        } catch (Exception ex) {
            throw new InvalidStudyException("Existing study configuration JSON is corrupted: " + ex.getMessage());
        }

        Map<String, String> idMap = new HashMap<>();
        Map<String, Integer> summary = new LinkedHashMap<>();
        String targetStudyId = studyId.toString();

        // 1. Process Custom Variables
        if (components.get("customVariables") instanceof List<?> rawList && !rawList.isEmpty()) {
            List<Map<String, Object>> existingCVs = getMutableList(currentConfig, "customVariables");
            Set<String> batchSeen = new HashSet<>();
            int addedCount = 0;

            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> cv = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String name = cv.get("name") != null ? cv.get("name").toString().trim() : "";
                    String varType = cv.get("variableType") != null ? cv.get("variableType").toString().trim() : "";
                    String dedupeKey = (name + "|" + varType).toLowerCase(Locale.ROOT);

                    if (batchSeen.contains(dedupeKey)) {
                        continue;
                    }
                    batchSeen.add(dedupeKey);

                    String oldCvId = String.valueOf(cv.get("_id") != null ? cv.get("_id") : cv.get("variableId"));

                    // Check if already in study
                    Map<String, Object> matchedExisting = existingCVs.stream()
                            .filter(e -> name.equalsIgnoreCase(String.valueOf(e.get("name")))
                                    && varType.equalsIgnoreCase(String.valueOf(e.get("variableType"))))
                            .findFirst().orElse(null);

                    if (matchedExisting != null) {
                        String existingId = String.valueOf(matchedExisting.get("_id") != null ? matchedExisting.get("_id") : matchedExisting.get("variableId"));
                        idMap.put(oldCvId, existingId);
                        // Map option IDs if present
                        remapOptionIds(cv, matchedExisting, idMap);
                    } else {
                        String newCvId = "cv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                        idMap.put(oldCvId, newCvId);
                        cv.put("_id", newCvId);
                        cv.put("variableId", newCvId);

                        if (cv.get("options") instanceof List<?> rawOptions) {
                            List<Map<String, Object>> newOptions = new ArrayList<>();
                            for (Object optObj : rawOptions) {
                                if (optObj instanceof Map<?, ?> optMap) {
                                    Map<String, Object> opt = new LinkedHashMap<>((Map<String, Object>) optMap);
                                    String oldOptId = String.valueOf(opt.get("optionId"));
                                    String newOptId = "opt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                                    idMap.put(oldOptId, newOptId);
                                    opt.put("optionId", newOptId);
                                    newOptions.add(opt);
                                }
                            }
                            cv.put("options", newOptions);
                        }
                        existingCVs.add(cv);
                        addedCount++;
                    }
                }
            }
            currentConfig.put("customVariables", existingCVs);
            summary.put("customVariables", addedCount);
        }

        // 2. Process Statuses
        if (components.get("statuses") instanceof List<?> rawList && !rawList.isEmpty()) {
            List<Map<String, Object>> existingStatuses = getMutableList(currentConfig, "statuses");
            Set<String> batchSeen = new HashSet<>();
            int addedCount = 0;

            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> st = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String name = st.get("name") != null ? st.get("name").toString().trim() : "";
                    boolean potential = Boolean.TRUE.equals(st.get("potential"));
                    String dedupeKey = (name + "|" + potential).toLowerCase(Locale.ROOT);

                    if (batchSeen.contains(dedupeKey)) {
                        continue;
                    }
                    batchSeen.add(dedupeKey);

                    String oldStId = String.valueOf(st.get("_id"));
                    Map<String, Object> matchedExisting = existingStatuses.stream()
                            .filter(e -> name.equalsIgnoreCase(String.valueOf(e.get("name")))
                                    && potential == Boolean.TRUE.equals(e.get("potential")))
                            .findFirst().orElse(null);

                    if (matchedExisting != null) {
                        idMap.put(oldStId, String.valueOf(matchedExisting.get("_id")));
                    } else {
                        String newStId = "stat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                        idMap.put(oldStId, newStId);
                        st.put("_id", newStId);
                        st.put("studyId", targetStudyId);
                        existingStatuses.add(st);
                        addedCount++;
                    }
                }
            }
            currentConfig.put("statuses", existingStatuses);
            summary.put("statuses", addedCount);
        }

        // 3. Process Events
        if (components.get("events") instanceof List<?> rawList && !rawList.isEmpty()) {
            List<Map<String, Object>> existingEvents = getMutableList(currentConfig, "events");
            Set<String> batchSeen = new HashSet<>();
            int addedCount = 0;

            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> evt = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String name = evt.get("name") != null ? evt.get("name").toString().trim().toLowerCase(Locale.ROOT) : "";

                    if (batchSeen.contains(name)) {
                        continue;
                    }
                    batchSeen.add(name);

                    String oldEvtId = String.valueOf(evt.get("_id"));
                    Map<String, Object> matchedExisting = existingEvents.stream()
                            .filter(e -> name.equalsIgnoreCase(String.valueOf(e.get("name")).trim()))
                            .findFirst().orElse(null);

                    if (matchedExisting != null) {
                        idMap.put(oldEvtId, String.valueOf(matchedExisting.get("_id")));
                    } else {
                        String newEvtId = "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                        idMap.put(oldEvtId, newEvtId);
                        evt.put("_id", newEvtId);
                        evt.put("studyId", targetStudyId);

                        if (evt.get("statuses") instanceof List<?> oldSts) {
                            List<String> remappedSts = new ArrayList<>();
                            for (Object s : oldSts) {
                                String sStr = String.valueOf(s);
                                remappedSts.add(idMap.getOrDefault(sStr, sStr));
                            }
                            evt.put("statuses", remappedSts);
                        }
                        existingEvents.add(evt);
                        addedCount++;
                    }
                }
            }
            currentConfig.put("events", existingEvents);
            summary.put("events", addedCount);
        }

        // 4. Process Email Templates
        if (components.get("emailTemplates") instanceof List<?> rawList && !rawList.isEmpty()) {
            List<Map<String, Object>> existingEmailTemps = getMutableList(currentConfig, "emailTemplates");
            Set<String> batchSeen = new HashSet<>();
            int addedCount = 0;

            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> et = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String name = et.get("name") != null ? et.get("name").toString().trim().toLowerCase(Locale.ROOT) : "";

                    if (batchSeen.contains(name)) {
                        continue;
                    }
                    batchSeen.add(name);

                    String oldId = String.valueOf(et.get("_id"));
                    Map<String, Object> matchedExisting = existingEmailTemps.stream()
                            .filter(e -> name.equalsIgnoreCase(String.valueOf(e.get("name")).trim()))
                            .findFirst().orElse(null);

                    if (matchedExisting != null) {
                        idMap.put(oldId, String.valueOf(matchedExisting.get("_id")));
                    } else {
                        String newId = "eml_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                        idMap.put(oldId, newId);
                        et.put("_id", newId);
                        et.put("studyId", targetStudyId);
                        existingEmailTemps.add(et);
                        addedCount++;
                    }
                }
            }
            currentConfig.put("emailTemplates", existingEmailTemps);
            summary.put("emailTemplates", addedCount);
        }

        // 5. Process Text Templates
        if (components.get("textTemplates") instanceof List<?> rawList && !rawList.isEmpty()) {
            List<Map<String, Object>> existingTextTemps = getMutableList(currentConfig, "textTemplates");
            Set<String> batchSeen = new HashSet<>();
            int addedCount = 0;

            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> tt = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String name = tt.get("name") != null ? tt.get("name").toString().trim().toLowerCase(Locale.ROOT) : "";

                    if (batchSeen.contains(name)) {
                        continue;
                    }
                    batchSeen.add(name);

                    String oldId = String.valueOf(tt.get("_id"));
                    Map<String, Object> matchedExisting = existingTextTemps.stream()
                            .filter(e -> name.equalsIgnoreCase(String.valueOf(e.get("name")).trim()))
                            .findFirst().orElse(null);

                    if (matchedExisting != null) {
                        idMap.put(oldId, String.valueOf(matchedExisting.get("_id")));
                    } else {
                        String newId = "txt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                        idMap.put(oldId, newId);
                        tt.put("_id", newId);
                        tt.put("studyId", targetStudyId);
                        existingTextTemps.add(tt);
                        addedCount++;
                    }
                }
            }
            currentConfig.put("textTemplates", existingTextTemps);
            summary.put("textTemplates", addedCount);
        }

        // 6. Process Scheduled Actions
        if (components.get("scheduledActions") instanceof List<?> rawList && !rawList.isEmpty()) {
            List<Map<String, Object>> existingActions = getMutableList(currentConfig, "scheduledActions");
            int addedCount = 0;

            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> sa = new LinkedHashMap<>((Map<String, Object>) origMap);
                    if (sa.get("templateId") != null) {
                        String oldTmplId = String.valueOf(sa.get("templateId"));
                        sa.put("templateId", idMap.getOrDefault(oldTmplId, oldTmplId));
                    }
                    if (sa.get("actionTriggerId") != null) {
                        String oldTrigId = String.valueOf(sa.get("actionTriggerId"));
                        sa.put("actionTriggerId", idMap.getOrDefault(oldTrigId, oldTrigId));
                    }
                    if (sa.get("action") instanceof Map<?, ?> actMap) {
                        Map<String, Object> mutableAct = new LinkedHashMap<>((Map<String, Object>) actMap);
                        mutableAct.put("actionTriggerStudyId", targetStudyId);
                        if (mutableAct.get("actionTriggerId") != null) {
                            String oldTrigId = String.valueOf(mutableAct.get("actionTriggerId"));
                            mutableAct.put("actionTriggerId", idMap.getOrDefault(oldTrigId, oldTrigId));
                        }
                        sa.put("action", mutableAct);
                    }
                    existingActions.add(sa);
                    addedCount++;
                }
            }
            currentConfig.put("scheduledActions", existingActions);
            summary.put("scheduledActions", addedCount);
        }

        // 7. Process Surveys
        if (components.get("surveys") instanceof List<?> rawList && !rawList.isEmpty()) {
            List<Map<String, Object>> existingSurveys = getMutableList(currentConfig, "surveys");
            Set<String> batchSeen = new HashSet<>();
            int addedCount = 0;

            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> origMap) {
                    Map<String, Object> srv = new LinkedHashMap<>((Map<String, Object>) origMap);
                    String name = srv.get("name") != null ? srv.get("name").toString().trim().toLowerCase(Locale.ROOT) : "";

                    if (batchSeen.contains(name)) {
                        continue;
                    }
                    batchSeen.add(name);

                    String oldSrvId = String.valueOf(srv.get("_id") != null ? srv.get("_id") : srv.get("surveyId"));
                    Map<String, Object> matchedExisting = existingSurveys.stream()
                            .filter(e -> name.equalsIgnoreCase(String.valueOf(e.get("name")).trim()))
                            .findFirst().orElse(null);

                    if (matchedExisting != null) {
                        idMap.put(oldSrvId, String.valueOf(matchedExisting.get("_id") != null ? matchedExisting.get("_id") : matchedExisting.get("surveyId")));
                    } else {
                        String newSrvId = "srv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                        idMap.put(oldSrvId, newSrvId);
                        srv.put("_id", newSrvId);
                        srv.put("studyId", targetStudyId);

                        // Remap email template references on survey
                        if (srv.get("eConsentCompletionEmailTemplateId") != null) {
                            String oldEml = String.valueOf(srv.get("eConsentCompletionEmailTemplateId"));
                            srv.put("eConsentCompletionEmailTemplateId", idMap.getOrDefault(oldEml, oldEml));
                        }
                        if (srv.get("submissionSigningInitialTemplate") != null) {
                            String oldEml = String.valueOf(srv.get("submissionSigningInitialTemplate"));
                            srv.put("submissionSigningInitialTemplate", idMap.getOrDefault(oldEml, oldEml));
                        }
                        if (srv.get("submissionSigningReminderTemplate") != null) {
                            String oldEml = String.valueOf(srv.get("submissionSigningReminderTemplate"));
                            srv.put("submissionSigningReminderTemplate", idMap.getOrDefault(oldEml, oldEml));
                        }

                        // Deep replace IDs within surveyJSON
                        if (srv.get("surveyJSON") != null) {
                            String srvJsonStr;
                            if (srv.get("surveyJSON") instanceof String str) {
                                srvJsonStr = str;
                            } else {
                                try {
                                    srvJsonStr = objectMapper.writeValueAsString(srv.get("surveyJSON"));
                                } catch (Exception ignored) {
                                    srvJsonStr = String.valueOf(srv.get("surveyJSON"));
                                }
                            }

                            for (Map.Entry<String, String> entry : idMap.entrySet()) {
                                srvJsonStr = srvJsonStr.replace(entry.getKey(), entry.getValue());
                            }
                            srv.put("surveyJSON", srvJsonStr);
                        }

                        existingSurveys.add(srv);
                        addedCount++;
                    }
                }
            }
            currentConfig.put("surveys", existingSurveys);
            summary.put("surveys", addedCount);
        }

        // 8. Process Contact Outcomes & Relationships
        for (String cat : List.of("contactOutcomes", "contactRelationships")) {
            if (components.get(cat) instanceof List<?> rawList && !rawList.isEmpty()) {
                List<Map<String, Object>> existingList = getMutableList(currentConfig, cat);
                Set<String> existingNames = new HashSet<>();
                for (Map<String, Object> item : existingList) {
                    Object name = item.get("outcome") != null ? item.get("outcome") : item.get("relationship");
                    if (name != null) {
                        existingNames.add(name.toString().trim().toLowerCase(Locale.ROOT));
                    }
                }

                int addedCount = 0;
                for (Object obj : rawList) {
                    if (obj instanceof Map<?, ?> origMap) {
                        Map<String, Object> item = new LinkedHashMap<>((Map<String, Object>) origMap);
                        Object nameObj = item.get("outcome") != null ? item.get("outcome") : item.get("relationship");
                        String nameStr = nameObj != null ? nameObj.toString().trim().toLowerCase(Locale.ROOT) : "";

                        if (!nameStr.isEmpty() && !existingNames.contains(nameStr)) {
                            item.put("_id", "cont_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
                            existingList.add(item);
                            existingNames.add(nameStr);
                            addedCount++;
                        }
                    }
                }
                currentConfig.put(cat, existingList);
                summary.put(cat, addedCount);
            }
        }

        int totalImported = summary.values().stream().mapToInt(Integer::intValue).sum();
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, currentConfig);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("importedCount", totalImported);
        result.put("summary", summary);
        result.put("message", "Successfully imported " + totalImported + " components into study.");
        return result;
    }

    private List<Map<String, Object>> getMutableList(Map<String, Object> config, String key) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (config.get(key) instanceof List<?> rawList) {
            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> m) {
                    list.add(new LinkedHashMap<>((Map<String, Object>) m));
                }
            }
        }
        return list;
    }

    private void remapOptionIds(Map<String, Object> incomingCv, Map<String, Object> existingCv, Map<String, String> idMap) {
        if (incomingCv.get("options") instanceof List<?> inOpts && existingCv.get("options") instanceof List<?> exOpts) {
            for (Object inOptObj : inOpts) {
                if (inOptObj instanceof Map<?, ?> inOptMap) {
                    String optName = inOptMap.get("name") != null ? inOptMap.get("name").toString().trim() : "";
                    String inOptId = String.valueOf(inOptMap.get("optionId"));

                    for (Object exOptObj : exOpts) {
                        if (exOptObj instanceof Map<?, ?> exOptMap) {
                            String exName = exOptMap.get("name") != null ? exOptMap.get("name").toString().trim() : "";
                            if (optName.equalsIgnoreCase(exName)) {
                                idMap.put(inOptId, String.valueOf(exOptMap.get("optionId")));
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // =========================================================================
    // Display Settings & Bulk Tasks Configuration Support
    // =========================================================================

    private static final List<LocaleOptionDto> SUPPORTED_LOCALE_OPTIONS = List.of(
            new LocaleOptionDto("en-US", "en-US - American English"),
            new LocaleOptionDto("en-GB", "en-GB - British English"),
            new LocaleOptionDto("en-CA", "en-CA - Canadian English"),
            new LocaleOptionDto("en-AU", "en-AU - Australian English"),
            new LocaleOptionDto("en", "en - English"),
            new LocaleOptionDto("es-ES", "es-ES - European Spanish"),
            new LocaleOptionDto("es-MX", "es-MX - Mexican Spanish"),
            new LocaleOptionDto("es-419", "es-419 - Latin American Spanish"),
            new LocaleOptionDto("es", "es - Spanish"),
            new LocaleOptionDto("fr", "fr - French"),
            new LocaleOptionDto("fr-CA", "fr-CA - Canadian French"),
            new LocaleOptionDto("fr-CH", "fr-CH - Swiss French"),
            new LocaleOptionDto("de", "de - German"),
            new LocaleOptionDto("de-AT", "de-AT - Austrian German"),
            new LocaleOptionDto("de-CH", "de-CH - Swiss High German"),
            new LocaleOptionDto("it", "it - Italian"),
            new LocaleOptionDto("pt", "pt - Portuguese"),
            new LocaleOptionDto("pt-BR", "pt-BR - Brazilian Portuguese"),
            new LocaleOptionDto("pt-PT", "pt-PT - European Portuguese"),
            new LocaleOptionDto("nl", "nl - Dutch"),
            new LocaleOptionDto("nl-BE", "nl-BE - Flemish"),
            new LocaleOptionDto("da", "da - Danish"),
            new LocaleOptionDto("sv", "sv - Swedish"),
            new LocaleOptionDto("nb", "nb - Norwegian BokmÃ¥l"),
            new LocaleOptionDto("fi", "fi - Finnish"),
            new LocaleOptionDto("pl", "pl - Polish"),
            new LocaleOptionDto("cs", "cs - Czech"),
            new LocaleOptionDto("sk", "sk - Slovak"),
            new LocaleOptionDto("hu", "hu - Hungarian"),
            new LocaleOptionDto("ro", "ro - Romanian"),
            new LocaleOptionDto("el", "el - Greek"),
            new LocaleOptionDto("tr", "tr - Turkish"),
            new LocaleOptionDto("ru", "ru - Russian"),
            new LocaleOptionDto("uk", "uk - Ukrainian"),
            new LocaleOptionDto("he", "he - Hebrew"),
            new LocaleOptionDto("hi", "hi - Hindi"),
            new LocaleOptionDto("id", "id - Indonesian"),
            new LocaleOptionDto("ms", "ms - Malay"),
            new LocaleOptionDto("vi", "vi - Vietnamese"),
            new LocaleOptionDto("ja", "ja - Japanese"),
            new LocaleOptionDto("ko", "ko - Korean"),
            new LocaleOptionDto("zh", "zh - Chinese"),
            new LocaleOptionDto("zh-Hans", "zh-Hans - Simplified Chinese")
    );

    private static final Set<String> VALID_LOCALE_CODES = new HashSet<>(Arrays.asList(
            "af", "afh", "ain", "akz", "ale", "am", "an", "anp", "arp", "ars", "arw", "avk", "az", "az-alt-short",
            "be", "bg", "bla", "bs", "ca", "cad", "car", "cay", "chb", "chg", "chn", "chy", "crh", "cs", "cy", "da",
            "de", "de-AT", "de-CH", "del", "din", "dum", "eka", "el", "elx", "en", "en-AU", "en-CA", "en-GB", "en-US",
            "es", "es-419", "es-ES", "es-MX", "et", "eu", "fat", "fi", "fil", "fo", "fr", "fr-CA", "fr-CH", "ga", "gba",
            "gl", "grb", "gu", "hai", "he", "hi", "hit", "hmn", "hr", "hu", "hup", "hy", "id", "ie", "io", "is", "it",
            "ja", "jbo", "jpr", "jrb", "ka", "kaw", "kbl", "kho", "kk", "km", "kn", "ko", "kr", "kut", "ky",
            "ky-alt-variant", "lam", "lfn", "liv", "lo", "lt", "lui", "lun", "lus", "lv", "mga", "mic", "mk", "ml",
            "mn", "mnc", "ms", "my-alt-variant", "mye", "nb", "nia", "nl", "nl-BE", "nog", "nov", "nwc", "nyo", "oj",
            "pa", "pi", "pl", "pro", "ps-alt-variant", "pt", "pt-BR", "pt-PT", "rap", "rar", "ro", "ro-MD", "rom",
            "ru", "rup", "sad", "sam", "see", "sel", "sh", "si", "sk", "sl", "sog", "sq", "sr", "sux", "sv", "sw",
            "sw-CD", "syc", "ta", "te", "ter", "tli", "to", "tr", "tsi", "tw", "ug-alt-variant", "uk", "ur", "uz",
            "vi", "was", "xal", "yue", "zap", "zbl", "zen", "zh", "zh-alt-long", "zh-Hans", "zu", "zun"
    ));

    private static final List<ParticipantColumnDto> STATIC_PARTICIPANT_COLUMN_OPTIONS = List.of(
            new ParticipantColumnDto("ID", "psi.customId"),
            new ParticipantColumnDto("Name", "p.name"),
            new ParticipantColumnDto("Next Appointment", "a.next_appointment", null, "Shows next chronological date"),
            new ParticipantColumnDto("Next Event", "a.next_event", null, "Shows date based on Events sort order"),
            new ParticipantColumnDto("Contact Info", "cm.information"),
            new ParticipantColumnDto("Last Contact", "psi.lastContactDate"),
            new ParticipantColumnDto("Global Date of Last Contact", "p.globalLastContactDate"),
            new ParticipantColumnDto("Last Comment", "c.lastComment"),
            new ParticipantColumnDto("Last Pinned Comment", "c.lastStickied"),
            new ParticipantColumnDto("Family ID", "p.familyId"),
            new ParticipantColumnDto("Global ID", "p.globalId"),
            new ParticipantColumnDto("Contact Name", "cm.contactName"),
            new ParticipantColumnDto("Contact Email", "cm.email"),
            new ParticipantColumnDto("Contact Phone", "cm.phone"),
            new ParticipantColumnDto("Address", "cm.address1"),
            new ParticipantColumnDto("City", "cm.city"),
            new ParticipantColumnDto("State", "cm.state"),
            new ParticipantColumnDto("Postal Code", "cm.zipcode"),
            new ParticipantColumnDto("Current Age", "a.currentAge"),
            new ParticipantColumnDto("Age (at time of study)", "psi.age"),
            new ParticipantColumnDto("Sex", "p.sex"),
            new ParticipantColumnDto("Ethnicity", "p.ethnicity"),
            new ParticipantColumnDto("Race", "p.race"),
            new ParticipantColumnDto("Birthday", "p.birthday"),
            new ParticipantColumnDto("Recruitment Source", "psi.sourceId"),
            new ParticipantColumnDto("Recruitment Site", "psi.siteId"),
            new ParticipantColumnDto("Recruitment Strategy", "psi.strategyId"),
            new ParticipantColumnDto("Date Added to Study", "psi.insertedAt"),
            new ParticipantColumnDto("Date Profile Created", "p.insertedAt"),
            new ParticipantColumnDto("Contact For Future Studies", "p.contactForFutureStudies"),
            new ParticipantColumnDto("Signed Consent Form", "psi.signedConsentForm"),
            new ParticipantColumnDto("Date Added to Enrolled", "psi.dateAddedToEnrolled"),
            new ParticipantColumnDto("Last Contact Outcome", "c.outcome"),
            new ParticipantColumnDto("Last Contact Comment", "c.comment"),
            new ParticipantColumnDto("Next Event Name", "a.next_event_name"),
            new ParticipantColumnDto("Next Appointment Name", "a.next_appointment_name"),
            new ParticipantColumnDto("Tags", "p.tags")
    );

    public boolean isLocaleSupported(String locale) {
        if (locale == null || locale.isBlank()) {
            return false;
        }
        return VALID_LOCALE_CODES.contains(locale.trim());
    }

    public List<LocaleOptionDto> getSupportedLocales() {
        return SUPPORTED_LOCALE_OPTIONS;
    }

    public static List<ParticipantColumnDto> getDefaultPotentialColumns() {
        return List.of(
                new ParticipantColumnDto("ID", "psi.customId"),
                new ParticipantColumnDto("Name", "p.name"),
                new ParticipantColumnDto("Next Appointment", "a.next_appointment", null, "Shows next chronological date"),
                new ParticipantColumnDto("Contact Info", "cm.information"),
                new ParticipantColumnDto("Last Contact", "psi.lastContactDate"),
                new ParticipantColumnDto("Recruitment Source", "psi.sourceId")
        );
    }

    public static List<ParticipantColumnDto> getDefaultEnrolledColumns() {
        return List.of(
                new ParticipantColumnDto("ID", "psi.customId"),
                new ParticipantColumnDto("Name", "p.name"),
                new ParticipantColumnDto("Next Appointment", "a.next_appointment", null, "Shows next chronological date")
        );
    }

    public static String makeCustomVariableColumnValue(String name) {
        if (name == null) {
            return "cv.";
        }
        return "cv." + name.replaceAll("\\W+", "_").toLowerCase(Locale.ROOT);
    }

    private Map<String, Object> loadOrCreateStudyConfigMap(UUID tenantId, UUID studyId) {
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        try {
            if (requirement.getConfiguration() != null && !requirement.getConfiguration().isBlank()) {
                return objectMapper.readValue(requirement.getConfiguration(), new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception ex) {
            throw new InvalidStudyException("Study configuration JSON is corrupted: " + ex.getMessage());
        }
        return new LinkedHashMap<>();
    }

    public List<ParticipantColumnDto> getAvailableColumnOptionsForConfig(Map<String, Object> configMap) {
        List<ParticipantColumnDto> options = new ArrayList<>(STATIC_PARTICIPANT_COLUMN_OPTIONS);
        if (configMap != null && configMap.get("customVariables") instanceof List<?> cvList) {
            for (Object obj : cvList) {
                if (obj instanceof Map<?, ?> cvMap) {
                    Object nameObj = cvMap.get("name");
                    if (nameObj != null && !nameObj.toString().isBlank()) {
                        String cvName = nameObj.toString().trim();
                        String cId = cvMap.get("_id") != null
                                ? cvMap.get("_id").toString()
                                : (cvMap.get("variableId") != null ? cvMap.get("variableId").toString() : null);
                        options.add(new ParticipantColumnDto(cvName, makeCustomVariableColumnValue(cvName), cId, null));
                    }
                }
            }
        }
        return options;
    }

    @Transactional(readOnly = true)
    public StudyDisplaySettingsResponse getDisplayConfiguration(
            UUID tenantId,
            UUID studyId,
            String studyLocale,
            boolean showGlobalComments,
            boolean defaultGlobalLogs,
            boolean canManage
    ) {
        Map<String, Object> configMap = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .map(req -> {
                    try {
                        if (req.getConfiguration() != null && !req.getConfiguration().isBlank()) {
                            return objectMapper.readValue(req.getConfiguration(), new TypeReference<Map<String, Object>>() {});
                        }
                    } catch (Exception ex) {
                        throw new InvalidStudyException("Study configuration JSON is corrupted: " + ex.getMessage());
                    }
                    return new LinkedHashMap<String, Object>();
                })
                .orElseGet(LinkedHashMap::new);

        return buildDisplaySettingsResponse(
                studyId,
                studyLocale,
                showGlobalComments,
                defaultGlobalLogs,
                canManage,
                configMap
        );
    }

    private StudyDisplaySettingsResponse buildDisplaySettingsResponse(
            UUID studyId,
            String studyLocale,
            boolean showGlobalComments,
            boolean defaultGlobalLogs,
            boolean canManage,
            Map<String, Object> configMap
    ) {
        List<ParticipantColumnDto> availableOptions = getAvailableColumnOptionsForConfig(configMap);
        Map<String, ParticipantColumnDto> optionByValue = new LinkedHashMap<>();
        for (ParticipantColumnDto opt : availableOptions) {
            optionByValue.put(opt.getValue(), opt);
        }

        boolean statusPageCombinedView = false;
        boolean enrolledShowEvents = true;
        List<ParticipantColumnDto> potentialCols = null;
        List<ParticipantColumnDto> enrolledCols = null;

        if (configMap.get("displaySettings") instanceof Map<?, ?> dsMap) {
            if (dsMap.get("statusPageCombinedView") instanceof Boolean b) {
                statusPageCombinedView = b;
            }
            if (dsMap.get("enrolledParticipantColumnsShowEvents") instanceof Boolean b) {
                enrolledShowEvents = b;
            }
            if (dsMap.get("potentialParticipantColumns") instanceof List<?> rawPot && !rawPot.isEmpty()) {
                potentialCols = parseColumnsList(rawPot, optionByValue);
            }
            if (dsMap.get("enrolledParticipantColumns") instanceof List<?> rawEnr && !rawEnr.isEmpty()) {
                enrolledCols = parseColumnsList(rawEnr, optionByValue);
            }
        }

        if (potentialCols == null || potentialCols.isEmpty()) {
            potentialCols = getDefaultPotentialColumns();
        }
        if (enrolledCols == null || enrolledCols.isEmpty()) {
            enrolledCols = getDefaultEnrolledColumns();
        }

        StudyDisplaySettingsResponse res = new StudyDisplaySettingsResponse();
        res.setStudyId(studyId.toString());
        res.setLocale((studyLocale != null && !studyLocale.isBlank()) ? studyLocale : "en-US");
        res.setShowGlobalComments(showGlobalComments);
        res.setDefaultGlobalLogs(defaultGlobalLogs);
        res.setStatusPageCombinedView(statusPageCombinedView);
        res.setEnrolledParticipantColumnsShowEvents(enrolledShowEvents);
        res.setPotentialParticipantColumns(potentialCols);
        res.setEnrolledParticipantColumns(enrolledCols);
        res.setAvailableColumnOptions(availableOptions);
        res.setSupportedLocales(SUPPORTED_LOCALE_OPTIONS);
        res.setCanManage(canManage);
        return res;
    }

    private List<ParticipantColumnDto> parseColumnsList(List<?> rawList, Map<String, ParticipantColumnDto> optionByValue) {
        List<ParticipantColumnDto> cols = new ArrayList<>();
        for (Object item : rawList) {
            if (item instanceof Map<?, ?> m) {
                String val = m.get("value") != null ? m.get("value").toString().trim() : "";
                String label = m.get("label") != null ? m.get("label").toString().trim() : "";
                String cId = m.get("cId") != null ? m.get("cId").toString() : null;
                ParticipantColumnDto matched = optionByValue.get(val);
                String title = matched != null ? matched.getTitle() : (m.get("title") != null ? m.get("title").toString() : null);
                if (label.isEmpty() && matched != null) {
                    label = matched.getLabel();
                }
                if (!val.isEmpty()) {
                    cols.add(new ParticipantColumnDto(label, val, cId, title));
                }
            }
        }
        return cols;
    }

    @Transactional
    public void updateDisplayCustomizationsInConfig(
            UUID tenantId,
            UUID studyId,
            UpdateStudyDisplaySettingsRequest request
    ) {
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<ParticipantColumnDto> availableOptions = getAvailableColumnOptionsForConfig(configMap);
        Map<String, ParticipantColumnDto> optionByValue = new LinkedHashMap<>();
        for (ParticipantColumnDto opt : availableOptions) {
            optionByValue.put(opt.getValue(), opt);
        }

        Map<String, Object> displaySettings = new LinkedHashMap<>();
        if (configMap.get("displaySettings") instanceof Map<?, ?> existingDs) {
            for (Map.Entry<?, ?> e : existingDs.entrySet()) {
                displaySettings.put(String.valueOf(e.getKey()), e.getValue());
            }
        } else {
            displaySettings.put("statusPageCombinedView", false);
            displaySettings.put("enrolledParticipantColumnsShowEvents", true);
            displaySettings.put("potentialParticipantColumns", serializeColumns(getDefaultPotentialColumns()));
            displaySettings.put("enrolledParticipantColumns", serializeColumns(getDefaultEnrolledColumns()));
        }

        if (request.getStatusPageCombinedView() != null) {
            displaySettings.put("statusPageCombinedView", request.getStatusPageCombinedView());
        }
        if (request.getEnrolledParticipantColumnsShowEvents() != null) {
            displaySettings.put("enrolledParticipantColumnsShowEvents", request.getEnrolledParticipantColumnsShowEvents());
        }
        if (request.getPotentialParticipantColumns() != null) {
            List<ParticipantColumnDto> validated = validateAndNormalizeColumns(
                    request.getPotentialParticipantColumns(),
                    optionByValue
            );
            displaySettings.put("potentialParticipantColumns", serializeColumns(validated));
        }
        if (request.getEnrolledParticipantColumns() != null) {
            List<ParticipantColumnDto> validated = validateAndNormalizeColumns(
                    request.getEnrolledParticipantColumns(),
                    optionByValue
            );
            displaySettings.put("enrolledParticipantColumns", serializeColumns(validated));
        }

        configMap.put("displaySettings", displaySettings);
        saveStudyRequirement(
                tenantId,
                studyId,
                requirement.getSampleSize() != null ? requirement.getSampleSize() : 100,
                configMap
        );
    }

    private List<ParticipantColumnDto> validateAndNormalizeColumns(
            List<ParticipantColumnDto> incoming,
            Map<String, ParticipantColumnDto> optionByValue
    ) {
        if (incoming == null || incoming.isEmpty()) {
            throw new InvalidStudyException("Must have at least one column for display.");
        }
        List<ParticipantColumnDto> normalized = new ArrayList<>();
        for (ParticipantColumnDto col : incoming) {
            if (col == null || col.getValue() == null || col.getValue().isBlank()) {
                throw new InvalidStudyException("Participant column value is required.");
            }
            String val = col.getValue().trim();
            ParticipantColumnDto allowed = optionByValue.get(val);
            if (allowed == null) {
                throw new InvalidStudyException("Unsupported participant column value: " + val);
            }
            normalized.add(new ParticipantColumnDto(
                    allowed.getLabel(),
                    allowed.getValue(),
                    allowed.getcId(),
                    allowed.getTitle()
            ));
        }
        return normalized;
    }

    private List<Map<String, Object>> serializeColumns(List<ParticipantColumnDto> cols) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (ParticipantColumnDto c : cols) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", c.getLabel());
            m.put("value", c.getValue());
            if (c.getcId() != null) {
                m.put("cId", c.getcId());
            }
            if (c.getTitle() != null) {
                m.put("title", c.getTitle());
            }
            list.add(m);
        }
        return list;
    }

    // =========================================================================
    // Bulk Tasks Configuration Support
    // =========================================================================

    private static final Set<String> ALLOWED_TRIGGER_ACTIONS = Set.of("completed", "scheduled");

    @Transactional(readOnly = true)
    public StudyBulkTasksResponse getBulkTasksConfiguration(
            UUID tenantId,
            UUID studyId,
            List<StudyAdminSummary> teamMembers,
            boolean canManage
    ) {
        Map<String, Object> configMap = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .map(req -> {
                    try {
                        if (req.getConfiguration() != null && !req.getConfiguration().isBlank()) {
                            return objectMapper.readValue(req.getConfiguration(), new TypeReference<Map<String, Object>>() {});
                        }
                    } catch (Exception ex) {
                        throw new InvalidStudyException("Study configuration JSON is corrupted: " + ex.getMessage());
                    }
                    return new LinkedHashMap<String, Object>();
                })
                .orElseGet(LinkedHashMap::new);

        return buildBulkTasksResponse(studyId, configMap, teamMembers, canManage);
    }

    private StudyBulkTasksResponse buildBulkTasksResponse(
            UUID studyId,
            Map<String, Object> configMap,
            List<StudyAdminSummary> teamMembers,
            boolean canManage
    ) {
        List<StudyAdminSummary> safeMembers = teamMembers != null ? teamMembers : Collections.emptyList();
        Map<String, String> memberInitialsMap = new HashMap<>();
        for (StudyAdminSummary m : safeMembers) {
            if (m.getUserId() != null) {
                memberInitialsMap.put(m.getUserId().toString(), m.getInitials() != null ? m.getInitials() : "");
            }
        }

        List<StudyBulkTasksResponse.StudyEventOptionDto> eventOptions = new ArrayList<>();
        if (configMap.get("events") instanceof List<?> rawEvents) {
            for (Object obj : rawEvents) {
                if (obj instanceof Map<?, ?> evtMap) {
                    String id = evtMap.get("_id") != null ? evtMap.get("_id").toString() : "";
                    String name = evtMap.get("name") != null ? evtMap.get("name").toString() : "";
                    if (!id.isEmpty() && !name.isEmpty()) {
                        eventOptions.add(new StudyBulkTasksResponse.StudyEventOptionDto(id, name));
                    }
                }
            }
        }

        List<StudyBulkTasksResponse.BulkTaskDto> allTasks = new ArrayList<>();
        if (configMap.get("bulkTasks") instanceof List<?> rawTasks) {
            for (Object obj : rawTasks) {
                if (obj instanceof Map<?, ?> btMap) {
                    StudyBulkTasksResponse.BulkTaskDto dto = new StudyBulkTasksResponse.BulkTaskDto();
                    dto.set_id(btMap.get("_id") != null ? btMap.get("_id").toString() : "");
                    dto.setStudyId(studyId.toString());
                    dto.setBulkTaskGroupId(btMap.get("bulkTaskGroupId") != null ? btMap.get("bulkTaskGroupId").toString() : "");
                    dto.setName(btMap.get("name") != null ? btMap.get("name").toString() : "");
                    dto.setDescription(btMap.get("description") != null ? btMap.get("description").toString() : "");
                    int rank = 0;
                    if (btMap.get("rank") instanceof Number n) {
                        rank = n.intValue();
                    }
                    dto.setRank(rank);

                    List<String> assignedTo = new ArrayList<>();
                    if (btMap.get("assignedTo") instanceof List<?> rawAssigned) {
                        for (Object a : rawAssigned) {
                            if (a != null && !a.toString().isBlank()) {
                                assignedTo.add(a.toString());
                            }
                        }
                    }
                    dto.setAssignedTo(assignedTo);

                    StringBuilder initialsBuilder = new StringBuilder();
                    for (String uid : assignedTo) {
                        String init = memberInitialsMap.get(uid);
                        if (init != null && !init.isBlank()) {
                            if (initialsBuilder.length() > 0) {
                                initialsBuilder.append(" ");
                            }
                            initialsBuilder.append(init);
                        }
                    }
                    dto.setAssignedToInitials(initialsBuilder.toString());
                    allTasks.add(dto);
                }
            }
        }

        allTasks.sort(Comparator.comparingInt(StudyBulkTasksResponse.BulkTaskDto::getRank));

        List<StudyBulkTasksResponse.BulkTaskGroupDto> groups = new ArrayList<>();
        if (configMap.get("bulkTaskGroups") instanceof List<?> rawGroups) {
            for (Object obj : rawGroups) {
                if (obj instanceof Map<?, ?> btgMap) {
                    StudyBulkTasksResponse.BulkTaskGroupDto gDto = new StudyBulkTasksResponse.BulkTaskGroupDto();
                    String gId = btgMap.get("_id") != null ? btgMap.get("_id").toString() : "";
                    gDto.set_id(gId);
                    gDto.setStudyId(studyId.toString());
                    gDto.setName(btgMap.get("name") != null ? btgMap.get("name").toString() : "");
                    gDto.setDescription(btgMap.get("description") != null ? btgMap.get("description").toString() : "");
                    boolean triggerActive = Boolean.TRUE.equals(btgMap.get("triggerActive"));
                    gDto.setTriggerActive(triggerActive);
                    if (triggerActive && btgMap.get("trigger") instanceof Map<?, ?> trigMap) {
                        String evtId = trigMap.get("eventId") != null ? trigMap.get("eventId").toString() : "";
                        String action = trigMap.get("action") != null ? trigMap.get("action").toString() : "";
                        gDto.setTrigger(new StudyBulkTasksResponse.BulkTaskTriggerDto(evtId, action));
                    }
                    List<StudyBulkTasksResponse.BulkTaskDto> groupTasks = allTasks.stream()
                            .filter(t -> gId.equals(t.getBulkTaskGroupId()))
                            .sorted(Comparator.comparingInt(StudyBulkTasksResponse.BulkTaskDto::getRank))
                            .toList();
                    gDto.setTasks(groupTasks);
                    groups.add(gDto);
                }
            }
        }

        StudyBulkTasksResponse response = new StudyBulkTasksResponse();
        response.setStudyId(studyId.toString());
        response.setBulkTaskGroups(groups);
        response.setBulkTasks(allTasks);
        response.setEvents(eventOptions);
        response.setTeamMembers(safeMembers);
        response.setCanManage(canManage);
        return response;
    }

    @Transactional
    public void createBulkTaskGroup(UUID tenantId, UUID studyId, SaveBulkTaskGroupRequest request) {
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> groups = getMutableList(configMap, "bulkTaskGroups");

        String name = validateGroupName(request != null ? request.getName() : null, groups, null);
        String description = (request.getDescription() != null) ? request.getDescription().trim() : "";
        boolean triggerActive = Boolean.TRUE.equals(request.getTriggerActive());

        Map<String, Object> newGroup = new LinkedHashMap<>();
        String newGroupId = "btg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        newGroup.put("_id", newGroupId);
        newGroup.put("studyId", studyId.toString());
        newGroup.put("name", name);
        newGroup.put("description", description);
        newGroup.put("triggerActive", triggerActive);

        if (triggerActive) {
            Map<String, Object> validatedTrigger = validateTrigger(request.getTrigger(), configMap);
            newGroup.put("trigger", validatedTrigger);
        }

        groups.add(newGroup);
        configMap.put("bulkTaskGroups", groups);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void updateBulkTaskGroup(UUID tenantId, UUID studyId, String groupId, SaveBulkTaskGroupRequest request) {
        if (groupId == null || groupId.isBlank()) {
            throw new InvalidStudyException("Bulk task group ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> groups = getMutableList(configMap, "bulkTaskGroups");

        Map<String, Object> target = groups.stream()
                .filter(g -> groupId.equals(String.valueOf(g.get("_id"))))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Bulk task group not found: " + groupId));

        String name = validateGroupName(request != null ? request.getName() : null, groups, groupId);
        String description = (request.getDescription() != null) ? request.getDescription().trim() : "";
        boolean triggerActive = Boolean.TRUE.equals(request.getTriggerActive());

        target.put("name", name);
        target.put("description", description);
        target.put("triggerActive", triggerActive);

        if (triggerActive) {
            Map<String, Object> validatedTrigger = validateTrigger(request.getTrigger(), configMap);
            target.put("trigger", validatedTrigger);
        } else {
            target.remove("trigger");
        }

        configMap.put("bulkTaskGroups", groups);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void deleteBulkTaskGroup(UUID tenantId, UUID studyId, String groupId) {
        if (groupId == null || groupId.isBlank()) {
            throw new InvalidStudyException("Bulk task group ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> groups = getMutableList(configMap, "bulkTaskGroups");

        boolean removed = groups.removeIf(g -> groupId.equals(String.valueOf(g.get("_id"))));
        if (!removed) {
            throw new InvalidStudyException("Bulk task group not found: " + groupId);
        }

        List<Map<String, Object>> tasks = getMutableList(configMap, "bulkTasks");
        tasks.removeIf(t -> groupId.equals(String.valueOf(t.get("bulkTaskGroupId"))));

        configMap.put("bulkTaskGroups", groups);
        configMap.put("bulkTasks", tasks);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void createBulkTask(UUID tenantId, UUID studyId, String groupId, SaveBulkTaskRequest request) {
        if (groupId == null || groupId.isBlank()) {
            throw new InvalidStudyException("Bulk task group ID is required.");
        }
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidStudyException("Task name is required.");
        }
        String taskName = request.getName().trim();
        if (taskName.length() > 200) {
            throw new InvalidStudyException("Task name must be 200 characters or less.");
        }

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> groups = getMutableList(configMap, "bulkTaskGroups");

        boolean groupExists = groups.stream().anyMatch(g -> groupId.equals(String.valueOf(g.get("_id"))));
        if (!groupExists) {
            throw new InvalidStudyException("Bulk task group not found: " + groupId);
        }

        List<Map<String, Object>> tasks = getMutableList(configMap, "bulkTasks");
        int maxRank = -1;
        for (Map<String, Object> t : tasks) {
            if (groupId.equals(String.valueOf(t.get("bulkTaskGroupId")))) {
                if (t.get("rank") instanceof Number n && n.intValue() > maxRank) {
                    maxRank = n.intValue();
                }
            }
        }

        Map<String, Object> newTask = new LinkedHashMap<>();
        newTask.put("_id", "bt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        newTask.put("studyId", studyId.toString());
        newTask.put("bulkTaskGroupId", groupId);
        newTask.put("name", taskName);
        newTask.put("description", request.getDescription() != null ? request.getDescription().trim() : "");
        newTask.put("rank", maxRank + 1);
        newTask.put("assignedTo", sanitizeAssignedTo(request.getAssignedTo()));

        tasks.add(newTask);
        configMap.put("bulkTasks", tasks);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void updateBulkTask(UUID tenantId, UUID studyId, String taskId, SaveBulkTaskRequest request) {
        if (taskId == null || taskId.isBlank()) {
            throw new InvalidStudyException("Task ID is required.");
        }
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidStudyException("Task name is required.");
        }
        String taskName = request.getName().trim();
        if (taskName.length() > 200) {
            throw new InvalidStudyException("Task name must be 200 characters or less.");
        }

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> tasks = getMutableList(configMap, "bulkTasks");

        Map<String, Object> target = tasks.stream()
                .filter(t -> taskId.equals(String.valueOf(t.get("_id"))))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Bulk task not found: " + taskId));

        target.put("name", taskName);
        target.put("description", request.getDescription() != null ? request.getDescription().trim() : "");
        target.put("assignedTo", sanitizeAssignedTo(request.getAssignedTo()));

        configMap.put("bulkTasks", tasks);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void deleteBulkTask(UUID tenantId, UUID studyId, String taskId) {
        if (taskId == null || taskId.isBlank()) {
            throw new InvalidStudyException("Task ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> tasks = getMutableList(configMap, "bulkTasks");

        boolean removed = tasks.removeIf(t -> taskId.equals(String.valueOf(t.get("_id"))));
        if (!removed) {
            throw new InvalidStudyException("Bulk task not found: " + taskId);
        }

        configMap.put("bulkTasks", tasks);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void reorderBulkTasks(UUID tenantId, UUID studyId, String groupId, List<String> taskIds) {
        if (groupId == null || groupId.isBlank()) {
            throw new InvalidStudyException("Bulk task group ID is required.");
        }
        if (taskIds == null || taskIds.isEmpty()) {
            return;
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> groups = getMutableList(configMap, "bulkTaskGroups");
        boolean groupExists = groups.stream().anyMatch(g -> groupId.equals(String.valueOf(g.get("_id"))));
        if (!groupExists) {
            throw new InvalidStudyException("Bulk task group not found: " + groupId);
        }

        List<Map<String, Object>> tasks = getMutableList(configMap, "bulkTasks");
        for (Map<String, Object> task : tasks) {
            if (groupId.equals(String.valueOf(task.get("bulkTaskGroupId")))) {
                String tId = String.valueOf(task.get("_id"));
                int idx = taskIds.indexOf(tId);
                if (idx >= 0) {
                    task.put("rank", idx);
                }
            }
        }

        configMap.put("bulkTasks", tasks);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    private String validateGroupName(String rawName, List<Map<String, Object>> existingGroups, String excludeGroupId) {
        if (rawName == null || rawName.trim().isEmpty()) {
            throw new InvalidStudyException("Bulk task group name is required.");
        }
        String trimmed = rawName.trim();
        if (trimmed.length() > 150) {
            throw new InvalidStudyException("Bulk task group name must be 150 characters or less.");
        }
        for (Map<String, Object> g : existingGroups) {
            String gId = String.valueOf(g.get("_id"));
            if (excludeGroupId != null && excludeGroupId.equals(gId)) {
                continue;
            }
            String existingName = g.get("name") != null ? g.get("name").toString().trim() : "";
            if (trimmed.equalsIgnoreCase(existingName)) {
                throw new InvalidStudyException("A bulk task group with this name already exists.");
            }
        }
        return trimmed;
    }

    private Map<String, Object> validateTrigger(
            StudyBulkTasksResponse.BulkTaskTriggerDto trigger,
            Map<String, Object> configMap
    ) {
        if (trigger == null
                || trigger.getEventId() == null || trigger.getEventId().trim().isEmpty()
                || trigger.getAction() == null || trigger.getAction().trim().isEmpty()) {
            throw new InvalidStudyException("Both trigger event and trigger action are required when Trigger is enabled.");
        }
        String eventId = trigger.getEventId().trim();
        String action = trigger.getAction().trim().toLowerCase(Locale.ROOT);

        if (!ALLOWED_TRIGGER_ACTIONS.contains(action)) {
            throw new InvalidStudyException("Trigger action must be 'completed' or 'scheduled'.");
        }

        boolean eventFound = false;
        if (configMap.get("events") instanceof List<?> rawEvents) {
            for (Object obj : rawEvents) {
                if (obj instanceof Map<?, ?> evtMap) {
                    if (eventId.equals(String.valueOf(evtMap.get("_id")))) {
                        eventFound = true;
                        break;
                    }
                }
            }
        }
        if (!eventFound) {
            throw new InvalidStudyException("Selected trigger event does not exist in this study.");
        }

        Map<String, Object> triggerMap = new LinkedHashMap<>();
        triggerMap.put("eventId", eventId);
        triggerMap.put("action", action);
        return triggerMap;
    }

    private List<String> sanitizeAssignedTo(List<String> raw) {
        if (raw == null) {
            return Collections.emptyList();
        }
        List<String> cleaned = new ArrayList<>();
        for (String id : raw) {
            if (id != null && !id.trim().isEmpty() && !cleaned.contains(id.trim())) {
                cleaned.add(id.trim());
            }
        }
        return cleaned;
    }

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    @Transactional(readOnly = true)
    public StudyEmailTextSettingsResponse getEmailAndTextConfiguration(
            UUID tenantId,
            UUID studyId,
            boolean canManage
    ) {
        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);

        List<StudyBulkTasksResponse.StudyEventOptionDto> events = new ArrayList<>();
        if (configMap.get("events") instanceof List<?> rawEvents) {
            for (Object obj : rawEvents) {
                if (obj instanceof Map<?, ?> evtMap) {
                    events.add(new StudyBulkTasksResponse.StudyEventOptionDto(
                            String.valueOf(evtMap.get("_id")),
                            evtMap.get("name") != null ? evtMap.get("name").toString() : ""
                    ));
                }
            }
        }

        Map<String, StudyScheduledActionDto> scheduledActionMap = new HashMap<>();
        if (configMap.get("scheduledActions") instanceof List<?> rawActions) {
            for (Object obj : rawActions) {
                if (obj instanceof Map<?, ?> saMap) {
                    String tId = saMap.get("templateId") != null ? String.valueOf(saMap.get("templateId")) : null;
                    if (tId != null) {
                        scheduledActionMap.put(tId, toScheduledActionDto(saMap, events));
                    }
                }
            }
        }

        List<StudyEmailTemplateDto> emailDtos = new ArrayList<>();
        if (configMap.get("emailTemplates") instanceof List<?> rawEmailTemps) {
            for (Object obj : rawEmailTemps) {
                if (obj instanceof Map<?, ?> etMap) {
                    StudyEmailTemplateDto dto = new StudyEmailTemplateDto();
                    dto.set_id(String.valueOf(etMap.get("_id")));
                    dto.setStudyId(etMap.get("studyId") != null ? String.valueOf(etMap.get("studyId")) : studyId.toString());
                    dto.setName(etMap.get("name") != null ? etMap.get("name").toString() : "");
                    dto.setDescription(etMap.get("description") != null ? etMap.get("description").toString() : "");
                    dto.setSubject(etMap.get("subject") != null ? etMap.get("subject").toString() : "");
                    dto.setMessage(etMap.get("message") != null ? etMap.get("message").toString() : "");
                    dto.setDesign(etMap.get("design") != null ? etMap.get("design").toString() : "");
                    dto.setMessageIsHtml(Boolean.TRUE.equals(etMap.get("messageIsHtml")));
                    dto.setReplyTo(etMap.get("replyTo") != null ? etMap.get("replyTo").toString() : "");
                    dto.setSenderName(etMap.get("senderName") != null ? etMap.get("senderName").toString() : "");
                    dto.setAttachmentFileIds(sanitizeAttachmentFileIds(etMap.get("attachmentFileIds") instanceof List<?> l ? (List<?>) l : null));
                    dto.setArchived(Boolean.TRUE.equals(etMap.get("archived")));
                    dto.setRank(etMap.get("rank") instanceof Number n ? n.intValue() : 0);
                    dto.setScheduledAction(scheduledActionMap.get(dto.get_id()));
                    emailDtos.add(dto);
                }
            }
        }

        emailDtos.sort((a, b) -> {
            if (a.isArchived() != b.isArchived()) return a.isArchived() ? 1 : -1;
            return Integer.compare(a.getRank(), b.getRank());
        });

        List<StudyTextTemplateDto> textDtos = new ArrayList<>();
        if (configMap.get("textTemplates") instanceof List<?> rawTextTemps) {
            for (Object obj : rawTextTemps) {
                if (obj instanceof Map<?, ?> ttMap) {
                    StudyTextTemplateDto dto = new StudyTextTemplateDto();
                    dto.set_id(String.valueOf(ttMap.get("_id")));
                    dto.setStudyId(ttMap.get("studyId") != null ? String.valueOf(ttMap.get("studyId")) : studyId.toString());
                    dto.setName(ttMap.get("name") != null ? ttMap.get("name").toString() : "");
                    dto.setDescription(ttMap.get("description") != null ? ttMap.get("description").toString() : "");
                    dto.setMessage(ttMap.get("message") != null ? ttMap.get("message").toString() : "");
                    dto.setArchived(Boolean.TRUE.equals(ttMap.get("archived")));
                    dto.setRank(ttMap.get("rank") instanceof Number n ? n.intValue() : 0);
                    dto.setScheduledAction(scheduledActionMap.get(dto.get_id()));
                    textDtos.add(dto);
                }
            }
        }

        textDtos.sort((a, b) -> {
            if (a.isArchived() != b.isArchived()) return a.isArchived() ? 1 : -1;
            return Integer.compare(a.getRank(), b.getRank());
        });

        StudyEmailTextSettingsResponse response = new StudyEmailTextSettingsResponse();
        response.setStudyId(studyId.toString());
        response.setCanManage(canManage);
        response.setTextMessagingEnabled(true);
        response.setEmailTemplates(emailDtos);
        response.setTextTemplates(textDtos);
        response.setEvents(events);
        return response;
    }

    @Transactional
    public void createEmailTemplate(UUID tenantId, UUID studyId, SaveEmailTemplateRequest request) {
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidStudyException("Email template name is required.");
        }
        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new InvalidStudyException("Email subject is required.");
        }
        String name = request.getName().trim();
        validateEmailTemplateName(name, tenantId, studyId, null);

        if (request.getReplyTo() != null && !request.getReplyTo().trim().isEmpty()) {
            validateEmailAddress(request.getReplyTo().trim());
        }

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> emailTemplates = getMutableList(configMap, "emailTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        int maxRank = -1;
        for (Map<String, Object> t : emailTemplates) {
            if (t.get("rank") instanceof Number n && n.intValue() > maxRank) {
                maxRank = n.intValue();
            }
        }

        String templateId = "et_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> newTemplate = new LinkedHashMap<>();
        newTemplate.put("_id", templateId);
        newTemplate.put("studyId", studyId.toString());
        newTemplate.put("name", name);
        newTemplate.put("subject", request.getSubject().trim());
        newTemplate.put("description", request.getDescription() != null ? request.getDescription().trim() : "");
        newTemplate.put("message", request.getMessage() != null ? request.getMessage() : "");
        newTemplate.put("design", request.getDesign() != null ? request.getDesign() : "");
        newTemplate.put("messageIsHtml", Boolean.TRUE.equals(request.getMessageIsHtml()));
        newTemplate.put("replyTo", request.getReplyTo() != null ? request.getReplyTo().trim() : "");
        newTemplate.put("senderName", request.getSenderName() != null ? request.getSenderName().trim() : "");
        newTemplate.put("attachmentFileIds", sanitizeAttachmentFileIds(request.getAttachmentFileIds()));
        newTemplate.put("archived", false);
        newTemplate.put("rank", maxRank + 1);
        newTemplate.put("createdAt", OffsetDateTime.now().toString());

        emailTemplates.add(newTemplate);
        configMap.put("emailTemplates", emailTemplates);

        if (request.getScheduledAction() != null && request.getScheduledAction().getAction() != null
                && request.getScheduledAction().getAction().getActionTriggerId() != null
                && !request.getScheduledAction().getAction().getActionTriggerId().isBlank()) {
            Map<String, Object> saMap = buildScheduledActionMap(templateId, "email", studyId.toString(), request.getScheduledAction());
            scheduledActions.add(saMap);
            configMap.put("scheduledActions", scheduledActions);
        }

        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void updateEmailTemplate(UUID tenantId, UUID studyId, String templateId, SaveEmailTemplateRequest request) {
        if (templateId == null || templateId.isBlank()) {
            throw new InvalidStudyException("Email template ID is required.");
        }
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidStudyException("Email template name is required.");
        }
        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new InvalidStudyException("Email subject is required.");
        }
        String name = request.getName().trim();
        validateEmailTemplateName(name, tenantId, studyId, templateId);

        if (request.getReplyTo() != null && !request.getReplyTo().trim().isEmpty()) {
            validateEmailAddress(request.getReplyTo().trim());
        }

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> emailTemplates = getMutableList(configMap, "emailTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        Map<String, Object> target = emailTemplates.stream()
                .filter(t -> templateId.equals(String.valueOf(t.get("_id"))))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Email template not found: " + templateId));

        target.put("name", name);
        target.put("subject", request.getSubject().trim());
        target.put("description", request.getDescription() != null ? request.getDescription().trim() : "");
        target.put("message", request.getMessage() != null ? request.getMessage() : "");
        target.put("design", request.getDesign() != null ? request.getDesign() : "");
        target.put("messageIsHtml", Boolean.TRUE.equals(request.getMessageIsHtml()));
        target.put("replyTo", request.getReplyTo() != null ? request.getReplyTo().trim() : "");
        target.put("senderName", request.getSenderName() != null ? request.getSenderName().trim() : "");
        target.put("attachmentFileIds", sanitizeAttachmentFileIds(request.getAttachmentFileIds()));
        target.put("updatedAt", OffsetDateTime.now().toString());

        scheduledActions.removeIf(sa -> templateId.equals(String.valueOf(sa.get("templateId"))));
        if (request.getScheduledAction() != null && request.getScheduledAction().getAction() != null
                && request.getScheduledAction().getAction().getActionTriggerId() != null
                && !request.getScheduledAction().getAction().getActionTriggerId().isBlank()) {
            Map<String, Object> saMap = buildScheduledActionMap(templateId, "email", studyId.toString(), request.getScheduledAction());
            scheduledActions.add(saMap);
        }

        configMap.put("emailTemplates", emailTemplates);
        configMap.put("scheduledActions", scheduledActions);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void copyEmailTemplate(UUID tenantId, UUID studyId, String templateId) {
        if (templateId == null || templateId.isBlank()) {
            throw new InvalidStudyException("Email template ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> emailTemplates = getMutableList(configMap, "emailTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        Map<String, Object> orig = emailTemplates.stream()
                .filter(t -> templateId.equals(String.valueOf(t.get("_id"))))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Email template not found: " + templateId));

        int maxRank = -1;
        for (Map<String, Object> t : emailTemplates) {
            if (t.get("rank") instanceof Number n && n.intValue() > maxRank) {
                maxRank = n.intValue();
            }
        }

        String newId = "et_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> copy = new LinkedHashMap<>(orig);
        copy.put("_id", newId);
        copy.put("name", "Copy of " + orig.get("name"));
        copy.put("archived", false);
        copy.put("rank", maxRank + 1);
        copy.put("createdAt", OffsetDateTime.now().toString());
        copy.remove("updatedAt");

        emailTemplates.add(copy);
        configMap.put("emailTemplates", emailTemplates);

        Optional<Map<String, Object>> origSa = scheduledActions.stream()
                .filter(sa -> templateId.equals(String.valueOf(sa.get("templateId"))))
                .findFirst();
        if (origSa.isPresent()) {
            Map<String, Object> copySa = new LinkedHashMap<>(origSa.get());
            copySa.put("_id", "sa_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            copySa.put("templateId", newId);
            scheduledActions.add(copySa);
            configMap.put("scheduledActions", scheduledActions);
        }

        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void archiveEmailTemplate(UUID tenantId, UUID studyId, String templateId) {
        setTemplateArchived(tenantId, studyId, "emailTemplates", templateId, true);
    }

    @Transactional
    public void restoreEmailTemplate(UUID tenantId, UUID studyId, String templateId) {
        setTemplateArchived(tenantId, studyId, "emailTemplates", templateId, false);
    }

    @Transactional
    public void deleteEmailTemplate(UUID tenantId, UUID studyId, String templateId) {
        if (templateId == null || templateId.isBlank()) {
            throw new InvalidStudyException("Email template ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> emailTemplates = getMutableList(configMap, "emailTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        boolean removed = emailTemplates.removeIf(t -> templateId.equals(String.valueOf(t.get("_id"))));
        if (!removed) {
            throw new InvalidStudyException("Email template not found: " + templateId);
        }
        scheduledActions.removeIf(sa -> templateId.equals(String.valueOf(sa.get("templateId"))));

        configMap.put("emailTemplates", emailTemplates);
        configMap.put("scheduledActions", scheduledActions);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void reorderEmailTemplates(UUID tenantId, UUID studyId, List<String> sortedIds) {
        if (sortedIds == null || sortedIds.isEmpty()) return;
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> emailTemplates = getMutableList(configMap, "emailTemplates");

        for (Map<String, Object> t : emailTemplates) {
            String id = String.valueOf(t.get("_id"));
            int idx = sortedIds.indexOf(id);
            if (idx >= 0) {
                t.put("rank", idx);
            }
        }
        configMap.put("emailTemplates", emailTemplates);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void createTextTemplate(UUID tenantId, UUID studyId, SaveTextTemplateRequest request) {
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidStudyException("Text template name is required.");
        }
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new InvalidStudyException("Text message is required.");
        }
        if (request.getMessage().length() > 1600) {
            throw new InvalidStudyException("Text message cannot exceed 1600 characters.");
        }
        String name = request.getName().trim();
        validateTextTemplateName(name, tenantId, studyId, null);

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> textTemplates = getMutableList(configMap, "textTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        int maxRank = -1;
        for (Map<String, Object> t : textTemplates) {
            if (t.get("rank") instanceof Number n && n.intValue() > maxRank) {
                maxRank = n.intValue();
            }
        }

        String templateId = "tt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> newTemplate = new LinkedHashMap<>();
        newTemplate.put("_id", templateId);
        newTemplate.put("studyId", studyId.toString());
        newTemplate.put("name", name);
        newTemplate.put("description", request.getDescription() != null ? request.getDescription().trim() : "");
        newTemplate.put("message", request.getMessage());
        newTemplate.put("archived", false);
        newTemplate.put("rank", maxRank + 1);
        newTemplate.put("createdAt", OffsetDateTime.now().toString());

        textTemplates.add(newTemplate);
        configMap.put("textTemplates", textTemplates);

        if (request.getScheduledAction() != null && request.getScheduledAction().getAction() != null
                && request.getScheduledAction().getAction().getActionTriggerId() != null
                && !request.getScheduledAction().getAction().getActionTriggerId().isBlank()) {
            Map<String, Object> saMap = buildScheduledActionMap(templateId, "text", studyId.toString(), request.getScheduledAction());
            scheduledActions.add(saMap);
            configMap.put("scheduledActions", scheduledActions);
        }

        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void updateTextTemplate(UUID tenantId, UUID studyId, String templateId, SaveTextTemplateRequest request) {
        if (templateId == null || templateId.isBlank()) {
            throw new InvalidStudyException("Text template ID is required.");
        }
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidStudyException("Text template name is required.");
        }
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new InvalidStudyException("Text message is required.");
        }
        if (request.getMessage().length() > 1600) {
            throw new InvalidStudyException("Text message cannot exceed 1600 characters.");
        }
        String name = request.getName().trim();
        validateTextTemplateName(name, tenantId, studyId, templateId);

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> textTemplates = getMutableList(configMap, "textTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        Map<String, Object> target = textTemplates.stream()
                .filter(t -> templateId.equals(String.valueOf(t.get("_id"))))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Text template not found: " + templateId));

        target.put("name", name);
        target.put("description", request.getDescription() != null ? request.getDescription().trim() : "");
        target.put("message", request.getMessage());
        target.put("updatedAt", OffsetDateTime.now().toString());

        scheduledActions.removeIf(sa -> templateId.equals(String.valueOf(sa.get("templateId"))));
        if (request.getScheduledAction() != null && request.getScheduledAction().getAction() != null
                && request.getScheduledAction().getAction().getActionTriggerId() != null
                && !request.getScheduledAction().getAction().getActionTriggerId().isBlank()) {
            Map<String, Object> saMap = buildScheduledActionMap(templateId, "text", studyId.toString(), request.getScheduledAction());
            scheduledActions.add(saMap);
        }

        configMap.put("textTemplates", textTemplates);
        configMap.put("scheduledActions", scheduledActions);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void copyTextTemplate(UUID tenantId, UUID studyId, String templateId) {
        if (templateId == null || templateId.isBlank()) {
            throw new InvalidStudyException("Text template ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> textTemplates = getMutableList(configMap, "textTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        Map<String, Object> orig = textTemplates.stream()
                .filter(t -> templateId.equals(String.valueOf(t.get("_id"))))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Text template not found: " + templateId));

        int maxRank = -1;
        for (Map<String, Object> t : textTemplates) {
            if (t.get("rank") instanceof Number n && n.intValue() > maxRank) {
                maxRank = n.intValue();
            }
        }

        String newId = "tt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> copy = new LinkedHashMap<>(orig);
        copy.put("_id", newId);
        copy.put("name", "Copy of " + orig.get("name"));
        copy.put("archived", false);
        copy.put("rank", maxRank + 1);
        copy.put("createdAt", OffsetDateTime.now().toString());
        copy.remove("updatedAt");

        textTemplates.add(copy);
        configMap.put("textTemplates", textTemplates);

        Optional<Map<String, Object>> origSa = scheduledActions.stream()
                .filter(sa -> templateId.equals(String.valueOf(sa.get("templateId"))))
                .findFirst();
        if (origSa.isPresent()) {
            Map<String, Object> copySa = new LinkedHashMap<>(origSa.get());
            copySa.put("_id", "sa_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            copySa.put("templateId", newId);
            scheduledActions.add(copySa);
            configMap.put("scheduledActions", scheduledActions);
        }

        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void archiveTextTemplate(UUID tenantId, UUID studyId, String templateId) {
        setTemplateArchived(tenantId, studyId, "textTemplates", templateId, true);
    }

    @Transactional
    public void restoreTextTemplate(UUID tenantId, UUID studyId, String templateId) {
        setTemplateArchived(tenantId, studyId, "textTemplates", templateId, false);
    }

    @Transactional
    public void deleteTextTemplate(UUID tenantId, UUID studyId, String templateId) {
        if (templateId == null || templateId.isBlank()) {
            throw new InvalidStudyException("Text template ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> textTemplates = getMutableList(configMap, "textTemplates");
        List<Map<String, Object>> scheduledActions = getMutableList(configMap, "scheduledActions");

        boolean removed = textTemplates.removeIf(t -> templateId.equals(String.valueOf(t.get("_id"))));
        if (!removed) {
            throw new InvalidStudyException("Text template not found: " + templateId);
        }
        scheduledActions.removeIf(sa -> templateId.equals(String.valueOf(sa.get("templateId"))));

        configMap.put("textTemplates", textTemplates);
        configMap.put("scheduledActions", scheduledActions);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    @Transactional
    public void reorderTextTemplates(UUID tenantId, UUID studyId, List<String> sortedIds) {
        if (sortedIds == null || sortedIds.isEmpty()) return;
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> textTemplates = getMutableList(configMap, "textTemplates");

        for (Map<String, Object> t : textTemplates) {
            String id = String.valueOf(t.get("_id"));
            int idx = sortedIds.indexOf(id);
            if (idx >= 0) {
                t.put("rank", idx);
            }
        }
        configMap.put("textTemplates", textTemplates);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    private void setTemplateArchived(UUID tenantId, UUID studyId, String listKey, String templateId, boolean archived) {
        if (templateId == null || templateId.isBlank()) {
            throw new InvalidStudyException("Template ID is required.");
        }
        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> templates = getMutableList(configMap, listKey);

        Map<String, Object> target = templates.stream()
                .filter(t -> templateId.equals(String.valueOf(t.get("_id"))))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Template not found: " + templateId));

        if (!archived) {
            String name = target.get("name") != null ? target.get("name").toString() : "";
            for (Map<String, Object> t : templates) {
                String id = String.valueOf(t.get("_id"));
                if (!id.equals(templateId) && !Boolean.TRUE.equals(t.get("archived"))) {
                    String existingName = t.get("name") != null ? t.get("name").toString() : "";
                    if (name.equalsIgnoreCase(existingName.trim())) {
                        throw new InvalidStudyException("Cannot restore template: an active template with the name '" + name + "' already exists.");
                    }
                }
            }
        }

        target.put("archived", archived);
        target.put("updatedAt", OffsetDateTime.now().toString());

        configMap.put(listKey, templates);
        saveStudyRequirement(tenantId, studyId, requirement.getSampleSize() != null ? requirement.getSampleSize() : 100, configMap);
    }

    private void validateEmailTemplateName(String name, UUID tenantId, UUID studyId, String excludeTemplateId) {
        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> emailTemplates = getMutableList(configMap, "emailTemplates");
        for (Map<String, Object> t : emailTemplates) {
            String id = String.valueOf(t.get("_id"));
            if (excludeTemplateId != null && excludeTemplateId.equals(id)) continue;
            if (Boolean.TRUE.equals(t.get("archived"))) continue;
            String existingName = t.get("name") != null ? t.get("name").toString().trim() : "";
            if (name.equalsIgnoreCase(existingName)) {
                throw new InvalidStudyException("An email template with the same name already exists.");
            }
        }
    }

    private void validateTextTemplateName(String name, UUID tenantId, UUID studyId, String excludeTemplateId) {
        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> textTemplates = getMutableList(configMap, "textTemplates");
        for (Map<String, Object> t : textTemplates) {
            String id = String.valueOf(t.get("_id"));
            if (excludeTemplateId != null && excludeTemplateId.equals(id)) continue;
            if (Boolean.TRUE.equals(t.get("archived"))) continue;
            String existingName = t.get("name") != null ? t.get("name").toString().trim() : "";
            if (name.equalsIgnoreCase(existingName)) {
                throw new InvalidStudyException("A text template with the same name already exists.");
            }
        }
    }

    private void validateEmailAddress(String email) {
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new InvalidStudyException("Invalid reply to address.");
        }
    }

    private List<String> sanitizeAttachmentFileIds(List<?> raw) {
        if (raw == null) return Collections.emptyList();
        List<String> list = new ArrayList<>();
        for (Object o : raw) {
            if (o != null && !o.toString().isBlank()) {
                list.add(o.toString().trim());
                if (list.size() >= 1) break; // Legacy Ripple restricts to at most 1 attachment
            }
        }
        return list;
    }

    private Map<String, Object> buildScheduledActionMap(
            String templateId,
            String actionType,
            String studyId,
            StudyScheduledActionDto saDto
    ) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("_id", "sa_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        map.put("templateId", templateId);

        Map<String, Object> actionMap = new LinkedHashMap<>();
        actionMap.put("actionTriggerStudyId", studyId);
        actionMap.put("actionType", actionType);
        if (saDto.getAction() != null) {
            actionMap.put("actionTriggerType", saDto.getAction().getActionTriggerType() != null ? saDto.getAction().getActionTriggerType() : "event");
            actionMap.put("actionTriggerId", saDto.getAction().getActionTriggerId() != null ? saDto.getAction().getActionTriggerId() : "");
        }
        map.put("action", actionMap);

        Map<String, Object> scheduleMap = new LinkedHashMap<>();
        if (saDto.getSchedule() != null) {
            scheduleMap.put("relativeInterval", saDto.getSchedule().getRelativeInterval());
            scheduleMap.put("relativeUnit", saDto.getSchedule().getRelativeUnit() != null ? saDto.getSchedule().getRelativeUnit() : "days");
            scheduleMap.put("relativeBeforeOrAfter", saDto.getSchedule().getRelativeBeforeOrAfter() != null ? saDto.getSchedule().getRelativeBeforeOrAfter() : "before");
            scheduleMap.put("dateType", saDto.getSchedule().getDateType() != null ? saDto.getSchedule().getDateType() : "scheduled");
        } else {
            scheduleMap.put("relativeInterval", 0);
            scheduleMap.put("relativeUnit", "days");
            scheduleMap.put("relativeBeforeOrAfter", "before");
            scheduleMap.put("dateType", "scheduled");
        }
        map.put("schedule", scheduleMap);
        return map;
    }

    private StudyScheduledActionDto toScheduledActionDto(
            Map<?, ?> saMap,
            List<StudyBulkTasksResponse.StudyEventOptionDto> events
    ) {
        StudyScheduledActionDto dto = new StudyScheduledActionDto();
        if (saMap.get("action") instanceof Map<?, ?> aMap) {
            StudyScheduledActionDto.ActionDetailsDto aDto = new StudyScheduledActionDto.ActionDetailsDto();
            aDto.setActionTriggerStudyId(aMap.get("actionTriggerStudyId") != null ? aMap.get("actionTriggerStudyId").toString() : null);
            aDto.setActionType(aMap.get("actionType") != null ? aMap.get("actionType").toString() : null);
            aDto.setActionTriggerType(aMap.get("actionTriggerType") != null ? aMap.get("actionTriggerType").toString() : null);
            String triggerId = aMap.get("actionTriggerId") != null ? aMap.get("actionTriggerId").toString() : null;
            aDto.setActionTriggerId(triggerId);
            if (triggerId != null) {
                for (StudyBulkTasksResponse.StudyEventOptionDto ev : events) {
                    if (triggerId.equals(ev.get_id())) {
                        aDto.setTriggerName(ev.getName());
                        break;
                    }
                }
            }
            dto.setAction(aDto);
        }
        if (saMap.get("schedule") instanceof Map<?, ?> sMap) {
            StudyScheduledActionDto.ScheduleInformationDto sDto = new StudyScheduledActionDto.ScheduleInformationDto();
            sDto.setRelativeInterval(sMap.get("relativeInterval") instanceof Number n ? n.intValue() : 0);
            sDto.setRelativeUnit(sMap.get("relativeUnit") != null ? sMap.get("relativeUnit").toString() : "days");
            sDto.setRelativeBeforeOrAfter(sMap.get("relativeBeforeOrAfter") != null ? sMap.get("relativeBeforeOrAfter").toString() : "before");
            sDto.setDateType(sMap.get("dateType") != null ? sMap.get("dateType").toString() : "scheduled");
            dto.setSchedule(sDto);
        }
        return dto;
    }

    // =========================================================================
    // STUDY REQUIREMENTS & PARTICIPANT SPECIFICATIONS
    // =========================================================================

    @Transactional(readOnly = true)
    public StudyRequirementsResponse getStudyRequirements(UUID tenantId, UUID studyId, boolean canManage) {
        Optional<StudyRequirement> requirementOpt = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId);
        StudyRequirement requirement = requirementOpt.orElse(null);

        Map<String, Object> configMap;
        if (requirement != null && requirement.getConfiguration() != null && !requirement.getConfiguration().isBlank()) {
            try {
                configMap = objectMapper.readValue(requirement.getConfiguration(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception ex) {
                log.warn("Corrupted configuration JSON for study {}: {}", studyId, ex.getMessage());
                configMap = new LinkedHashMap<>();
            }
        } else {
            configMap = new LinkedHashMap<>();
        }

        StudyRequirementsResponse response = new StudyRequirementsResponse();
        response.setStudyId(studyId.toString());
        response.setSampleSize(requirement != null && requirement.getSampleSize() != null ? requirement.getSampleSize() : 100);
        response.setCanManage(canManage);

        // 1. Milestones
        List<StudyMilestoneDto> milestoneDtos = new ArrayList<>();
        if (studyMilestoneRepository != null) {
            try {
                List<StudyMilestone> milestones = studyMilestoneRepository
                        .findByTenantIdAndStudyIdOrderByMilestoneDateAsc(tenantId, studyId);
                for (StudyMilestone m : milestones) {
                    milestoneDtos.add(new StudyMilestoneDto(
                            m.getId().toString(),
                            m.getMilestoneDate() != null ? m.getMilestoneDate().toString() : "",
                            m.getParticipantTarget(),
                            m.getDescription()
                    ));
                }
            } catch (Exception ex) {
                log.warn("Failed to load milestones from repository for study {}: {}", studyId, ex.getMessage());
            }
        }
        if (milestoneDtos.isEmpty() && configMap.get("milestones") instanceof List<?> rawMilestones) {
            for (Object obj : rawMilestones) {
                if (obj instanceof Map<?, ?> mMap) {
                    String id = mMap.get("_id") != null ? mMap.get("_id").toString() : (mMap.get("id") != null ? mMap.get("id").toString() : "");
                    String date = mMap.get("date") != null ? mMap.get("date").toString() : (mMap.get("milestoneDate") != null ? mMap.get("milestoneDate").toString() : "");
                    Integer target = mMap.get("numParticipants") instanceof Number n ? n.intValue() : (mMap.get("participantTarget") instanceof Number n2 ? n2.intValue() : null);
                    String desc = mMap.get("description") != null ? mMap.get("description").toString() : "";
                    milestoneDtos.add(new StudyMilestoneDto(id, date, target, desc));
                }
            }
        }
        response.setMilestones(milestoneDtos);

        // 2. Demographic Groups
        Object rawGroups = configMap.get("studyGroups") != null ? configMap.get("studyGroups") : configMap.get("groups");
        List<DemographicGroupDto> groups = parseDemographicGroups(rawGroups);
        Object rawGenderGroups = configMap.get("genderGroups");
        if (rawGenderGroups instanceof List<?> gList) {
            for (Object gObj : gList) {
                if (gObj instanceof Map<?, ?> gMap) {
                    DemographicGroupDto gDto = new DemographicGroupDto();
                    gDto.setId(gMap.get("_id") != null ? gMap.get("_id").toString() : UUID.randomUUID().toString());
                    gDto.setDefaultCategoryName("sex");
                    gDto.setLabel(gMap.get("name") != null ? gMap.get("name").toString() : (gMap.get("label") != null ? gMap.get("label").toString() : ""));
                    gDto.setSampleSize(gMap.get("sample") != null ? gMap.get("sample").toString() : (gMap.get("sampleSize") != null ? gMap.get("sampleSize").toString() : ""));
                    groups.add(gDto);
                }
            }
        }
        response.setStudyGroups(groups);

        // 3. Custom Variables
        List<StudyCustomVariableDto> cvs = parseCustomVariables(configMap.get("customVariables"));
        response.setCustomVariables(cvs);

        // 4. Variable Groups
        List<StudyVariableGroupDto> vgs = parseVariableGroups(configMap.get("variableGroups"));
        response.setVariableGroups(vgs);

        // 5. Custom Variable Layout
        Object rawLayout = configMap.get("customVariableLayout") != null ? configMap.get("customVariableLayout") : configMap.get("layout");
        List<StudyLayoutItemDto> layout = parseLayoutItems(rawLayout, cvs, vgs);
        response.setCustomVariableLayout(layout);

        // 6. Contact Relationships
        List<ContactTaxonomyDto> relationships = parseContactTaxonomy(configMap.get("contactRelationships"), "relationship", List.of("Mother", "Father", "Guardian", "Self", "Spouse", "Other"));
        response.setContactRelationships(relationships);

        // 7. Contact Outcomes
        List<ContactTaxonomyDto> outcomes = parseContactTaxonomy(configMap.get("contactOutcomes"), "outcome", List.of("Participant Added", "Call Completed", "Voicemail Left", "Email Sent", "Other"));
        response.setContactOutcomes(outcomes);

        // 8. Global Variables Discovery in Tenant
        List<StudyCustomVariableDto> globals = findTenantGlobalVariables(tenantId);
        response.setGlobalVariables(globals);

        return response;
    }

    @Transactional
    public StudyRequirementsResponse updateStudyRequirements(
            UUID tenantId,
            UUID studyId,
            UpdateStudyRequirementsRequest request,
            boolean canManage
    ) {
        if (request == null) {
            throw new InvalidStudyException("Update study requirements request cannot be null.");
        }

        StudyRequirement requirement = studyRequirementRepository
                .findByTenantIdAndStudyId(tenantId, studyId)
                .orElseGet(() -> createDefaultConfiguration(tenantId, studyId, 100));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);

        if (request.getSampleSize() != null) {
            if (request.getSampleSize() < 0) {
                throw new InvalidStudyException("Sample size (N) cannot be negative.");
            }
            requirement.setSampleSize(request.getSampleSize());
        }

        if (request.getStudyGroups() != null) {
            configMap.put("studyGroups", serializeDemographicGroups(request.getStudyGroups(), studyId.toString()));
        }
        if (request.getCustomVariables() != null) {
            configMap.put("customVariables", serializeCustomVariables(request.getCustomVariables()));
        }
        if (request.getVariableGroups() != null) {
            configMap.put("variableGroups", serializeVariableGroups(request.getVariableGroups()));
        }
        if (request.getCustomVariableLayout() != null) {
            configMap.put("customVariableLayout", serializeLayoutItems(request.getCustomVariableLayout()));
        }
        if (request.getContactRelationships() != null) {
            configMap.put("contactRelationships", serializeContactTaxonomy(request.getContactRelationships(), "relationship"));
        }
        if (request.getContactOutcomes() != null) {
            configMap.put("contactOutcomes", serializeContactTaxonomy(request.getContactOutcomes(), "outcome"));
        }

        saveStudyRequirement(
                tenantId,
                studyId,
                requirement.getSampleSize() != null ? requirement.getSampleSize() : 100,
                configMap
        );

        return getStudyRequirements(tenantId, studyId, canManage);
    }

    @Transactional
    public StudyMilestoneDto addStudyMilestone(UUID tenantId, UUID studyId, StudyMilestoneDto dto) {
        String dateStr = dto != null && dto.getMilestoneDate() != null ? dto.getMilestoneDate().trim() : "";
        LocalDate date = LocalDate.now();
        if (!dateStr.isBlank()) {
            try {
                date = LocalDate.parse(dateStr.substring(0, Math.min(10, dateStr.length())));
            } catch (Exception ignored) {}
        }
        Integer target = dto != null && dto.getParticipantTarget() != null ? dto.getParticipantTarget() : 0;
        String desc = dto != null && dto.getDescription() != null ? dto.getDescription().trim() : "";

        String milestoneId = UUID.randomUUID().toString();
        if (studyMilestoneRepository != null) {
            StudyMilestone entity = new StudyMilestone();
            entity.setTenantId(tenantId);
            entity.setStudyId(studyId);
            entity.setMilestoneDate(date);
            entity.setParticipantTarget(target);
            entity.setDescription(desc);
            StudyMilestone saved = studyMilestoneRepository.save(entity);
            milestoneId = saved.getId().toString();
        }

        // Also update in configMap for fallback consistency
        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> mList = getMutableList(configMap, "milestones");
        Map<String, Object> mMap = new LinkedHashMap<>();
        mMap.put("_id", milestoneId);
        mMap.put("date", date.toString());
        mMap.put("numParticipants", target);
        mMap.put("description", desc);
        mList.add(mMap);
        configMap.put("milestones", mList);
        StudyRequirement req = studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId).orElse(null);
        saveStudyRequirement(tenantId, studyId, req != null && req.getSampleSize() != null ? req.getSampleSize() : 100, configMap);

        return new StudyMilestoneDto(milestoneId, date.toString(), target, desc);
    }

    @Transactional
    public StudyMilestoneDto updateStudyMilestone(UUID tenantId, UUID studyId, String milestoneId, StudyMilestoneDto dto) {
        if (milestoneId == null || milestoneId.isBlank()) {
            throw new InvalidStudyException("Milestone ID is required.");
        }
        LocalDate date = null;
        if (dto != null && dto.getMilestoneDate() != null && !dto.getMilestoneDate().isBlank()) {
            try {
                date = LocalDate.parse(dto.getMilestoneDate().substring(0, Math.min(10, dto.getMilestoneDate().length())));
            } catch (Exception ignored) {}
        }
        Integer target = dto != null ? dto.getParticipantTarget() : null;
        String desc = dto != null ? dto.getDescription() : null;

        if (studyMilestoneRepository != null) {
            try {
                UUID mUuid = UUID.fromString(milestoneId);
                Optional<StudyMilestone> opt = studyMilestoneRepository.findByTenantIdAndStudyIdAndId(tenantId, studyId, mUuid);
                if (opt.isPresent()) {
                    StudyMilestone m = opt.get();
                    if (date != null) m.setMilestoneDate(date);
                    if (target != null) m.setParticipantTarget(target);
                    if (desc != null) m.setDescription(desc);
                    studyMilestoneRepository.save(m);
                }
            } catch (Exception ignored) {}
        }

        // Update in configMap
        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> mList = getMutableList(configMap, "milestones");
        for (Map<String, Object> m : mList) {
            if (milestoneId.equals(m.get("_id")) || milestoneId.equals(m.get("id"))) {
                if (date != null) m.put("date", date.toString());
                if (target != null) m.put("numParticipants", target);
                if (desc != null) m.put("description", desc);
                break;
            }
        }
        configMap.put("milestones", mList);
        StudyRequirement req = studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId).orElse(null);
        saveStudyRequirement(tenantId, studyId, req != null && req.getSampleSize() != null ? req.getSampleSize() : 100, configMap);

        return new StudyMilestoneDto(milestoneId, date != null ? date.toString() : "", target, desc);
    }

    @Transactional
    public void deleteStudyMilestone(UUID tenantId, UUID studyId, String milestoneId) {
        if (milestoneId == null || milestoneId.isBlank()) {
            throw new InvalidStudyException("Milestone ID is required.");
        }
        if (studyMilestoneRepository != null) {
            try {
                UUID mUuid = UUID.fromString(milestoneId);
                studyMilestoneRepository.findByTenantIdAndStudyIdAndId(tenantId, studyId, mUuid)
                        .ifPresent(studyMilestoneRepository::delete);
            } catch (Exception ignored) {}
        }
        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> mList = getMutableList(configMap, "milestones");
        mList.removeIf(m -> milestoneId.equals(m.get("_id")) || milestoneId.equals(m.get("id")));
        configMap.put("milestones", mList);
        StudyRequirement req = studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId).orElse(null);
        saveStudyRequirement(tenantId, studyId, req != null && req.getSampleSize() != null ? req.getSampleSize() : 100, configMap);
    }

    @Transactional(readOnly = true)
    public List<StudyCustomVariableDto> findTenantGlobalVariables(UUID tenantId) {
        Map<String, StudyCustomVariableDto> globalVars = new LinkedHashMap<>();
        try {
            List<StudyRequirement> allReqs = studyRequirementRepository.findByTenantId(tenantId);
            for (StudyRequirement req : allReqs) {
                if (req.getConfiguration() == null || req.getConfiguration().isBlank()) continue;
                try {
                    Map<String, Object> cfg = objectMapper.readValue(req.getConfiguration(), new TypeReference<Map<String, Object>>() {});
                    List<StudyCustomVariableDto> cvList = parseCustomVariables(cfg.get("customVariables"));
                    for (StudyCustomVariableDto cv : cvList) {
                        if (cv.isGlobal()) {
                            globalVars.putIfAbsent(cv.getName().toLowerCase().trim(), cv);
                        }
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception ex) {
            log.warn("Failed to discover global variables for tenant {}: {}", tenantId, ex.getMessage());
        }
        return new ArrayList<>(globalVars.values());
    }

    @Transactional
    public StudyCustomVariableDto addGlobalVariableToStudy(UUID tenantId, UUID studyId, String variableId) {
        List<StudyCustomVariableDto> allGlobals = findTenantGlobalVariables(tenantId);
        StudyCustomVariableDto target = allGlobals.stream()
                .filter(v -> variableId.equals(v.getId()) || variableId.equalsIgnoreCase(v.getName()))
                .findFirst()
                .orElseThrow(() -> new InvalidStudyException("Global variable not found: " + variableId));

        Map<String, Object> configMap = loadOrCreateStudyConfigMap(tenantId, studyId);
        List<Map<String, Object>> cvList = getMutableList(configMap, "customVariables");

        // Check if already in study
        boolean alreadyExists = cvList.stream().anyMatch(v ->
                target.getId().equals(v.get("_id")) || target.getId().equals(v.get("variableId")) ||
                (v.get("name") != null && target.getName().equalsIgnoreCase(v.get("name").toString().trim()))
        );
        if (alreadyExists) {
            throw new InvalidStudyException("Variable is already attached to this study.");
        }

        Map<String, Object> newCv = new LinkedHashMap<>();
        newCv.put("_id", target.getId());
        newCv.put("variableId", target.getId());
        newCv.put("name", target.getName());
        newCv.put("variableType", target.getVariableType());
        newCv.put("isGlobal", true);
        newCv.put("isBlind", target.isBlind());
        newCv.put("rank", cvList.size());

        List<Map<String, Object>> opts = new ArrayList<>();
        if (target.getOptions() != null) {
            for (StudyCustomVariableDto.VariableOptionDto o : target.getOptions()) {
                Map<String, Object> optMap = new LinkedHashMap<>();
                optMap.put("optionId", o.getOptionId());
                optMap.put("name", o.getName());
                opts.add(optMap);
            }
        }
        newCv.put("options", opts);
        cvList.add(newCv);
        configMap.put("customVariables", cvList);

        // Also add to customVariableLayout
        List<Map<String, Object>> layout = getMutableList(configMap, "customVariableLayout");
        Map<String, Object> layoutItem = new LinkedHashMap<>();
        layoutItem.put("_id", "lay_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        layoutItem.put("type", "variable");
        layoutItem.put("refId", target.getId());
        layoutItem.put("rank", layout.size());
        layout.add(layoutItem);
        configMap.put("customVariableLayout", layout);

        StudyRequirement req = studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId).orElse(null);
        saveStudyRequirement(tenantId, studyId, req != null && req.getSampleSize() != null ? req.getSampleSize() : 100, configMap);

        return target;
    }

    // =========================================================================
    // PARSING & SERIALIZATION HELPERS FOR REQUIREMENTS
    // =========================================================================

    private List<DemographicGroupDto> parseDemographicGroups(Object raw) {
        List<DemographicGroupDto> groups = new ArrayList<>();
        if (!(raw instanceof List<?> list)) return groups;

        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                DemographicGroupDto dto = new DemographicGroupDto();
                dto.setId(map.get("_id") != null ? map.get("_id").toString() : (map.get("id") != null ? map.get("id").toString() : UUID.randomUUID().toString()));
                dto.setDefaultCategoryName(map.get("defaultCategoryName") != null ? map.get("defaultCategoryName").toString() : "age");
                dto.setLabel(map.get("label") != null ? map.get("label").toString() : (map.get("name") != null ? map.get("name").toString() : ""));
                dto.setSampleSize(map.get("sampleSize") != null ? map.get("sampleSize").toString() : (map.get("sample") != null ? map.get("sample").toString() : ""));

                if (map.get("ageRange") instanceof Map<?, ?> arMap) {
                    Integer min = arMap.get("min") instanceof Number n ? n.intValue() : null;
                    Integer max = arMap.get("max") instanceof Number n ? n.intValue() : null;
                    dto.setAgeRange(new DemographicGroupDto.AgeRangeDto(min, max));
                } else if (map.get("minAge") != null || map.get("maxAge") != null) {
                    Integer min = map.get("minAge") instanceof Number n ? n.intValue() : null;
                    Integer max = map.get("maxAge") instanceof Number n ? n.intValue() : null;
                    dto.setAgeRange(new DemographicGroupDto.AgeRangeDto(min, max));
                }

                List<DemographicGroupDto.GenderGroupDto> genderList = new ArrayList<>();
                if (map.get("genderGroups") instanceof List<?> gList) {
                    for (Object gObj : gList) {
                        if (gObj instanceof Map<?, ?> gMap) {
                            String gId = gMap.get("_id") != null ? gMap.get("_id").toString() : (gMap.get("id") != null ? gMap.get("id").toString() : UUID.randomUUID().toString());
                            String gender = gMap.get("gender") != null ? gMap.get("gender").toString() : "Other";
                            Integer participants = gMap.get("participants") instanceof Number n ? n.intValue() : null;
                            genderList.add(new DemographicGroupDto.GenderGroupDto(gId, gender, participants));
                        }
                    }
                }
                dto.setGenderGroups(genderList);
                groups.add(dto);
            }
        }
        return groups;
    }

    private List<Map<String, Object>> serializeDemographicGroups(List<DemographicGroupDto> dtos, String studyId) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (dtos == null) return list;

        for (DemographicGroupDto dto : dtos) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", dto.getId() != null && !dto.getId().isBlank() ? dto.getId() : "grp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            map.put("studyId", studyId);
            map.put("defaultCategoryName", dto.getDefaultCategoryName() != null ? dto.getDefaultCategoryName() : "age");
            map.put("label", dto.getLabel() != null ? dto.getLabel().trim() : "");
            map.put("sampleSize", dto.getSampleSize() != null ? dto.getSampleSize().trim() : "");

            if (dto.getAgeRange() != null && (dto.getAgeRange().getMin() != null || dto.getAgeRange().getMax() != null)) {
                Map<String, Object> ar = new LinkedHashMap<>();
                if (dto.getAgeRange().getMin() != null) ar.put("min", dto.getAgeRange().getMin());
                if (dto.getAgeRange().getMax() != null) ar.put("max", dto.getAgeRange().getMax());
                map.put("ageRange", ar);
            }

            if (dto.getGenderGroups() != null && !dto.getGenderGroups().isEmpty()) {
                List<Map<String, Object>> ggList = new ArrayList<>();
                for (DemographicGroupDto.GenderGroupDto gg : dto.getGenderGroups()) {
                    Map<String, Object> ggMap = new LinkedHashMap<>();
                    ggMap.put("_id", gg.getId() != null && !gg.getId().isBlank() ? gg.getId() : "gg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
                    ggMap.put("gender", gg.getGender() != null ? gg.getGender() : "Other");
                    ggMap.put("participants", gg.getParticipants());
                    ggList.add(ggMap);
                }
                map.put("genderGroups", ggList);
            }
            list.add(map);
        }
        return list;
    }

    private List<StudyCustomVariableDto> parseCustomVariables(Object raw) {
        List<StudyCustomVariableDto> vars = new ArrayList<>();
        if (!(raw instanceof List<?> list)) return vars;

        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                StudyCustomVariableDto dto = new StudyCustomVariableDto();
                dto.setId(map.get("_id") != null ? map.get("_id").toString() : (map.get("variableId") != null ? map.get("variableId").toString() : ""));
                dto.setName(map.get("name") != null ? map.get("name").toString() : "");
                dto.setVariableType(map.get("variableType") != null ? map.get("variableType").toString() : "short");
                dto.setGlobal(Boolean.TRUE.equals(map.get("isGlobal")));
                dto.setBlind(Boolean.TRUE.equals(map.get("isBlind")));
                dto.setRank(map.get("rank") instanceof Number n ? n.intValue() : 0);

                List<StudyCustomVariableDto.VariableOptionDto> options = new ArrayList<>();
                if (map.get("options") instanceof List<?> optList) {
                    for (Object optObj : optList) {
                        if (optObj instanceof Map<?, ?> optMap) {
                            String optId = optMap.get("optionId") != null ? optMap.get("optionId").toString() : "";
                            String optName = optMap.get("name") != null ? optMap.get("name").toString() : (optMap.get("label") != null ? optMap.get("label").toString() : "");
                            options.add(new StudyCustomVariableDto.VariableOptionDto(optId, optName));
                        }
                    }
                }
                dto.setOptions(options);
                vars.add(dto);
            }
        }
        return vars;
    }

    private List<Map<String, Object>> serializeCustomVariables(List<StudyCustomVariableDto> dtos) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (dtos == null) return list;

        int rank = 0;
        for (StudyCustomVariableDto dto : dtos) {
            Map<String, Object> map = new LinkedHashMap<>();
            String id = dto.getId() != null && !dto.getId().isBlank() ? dto.getId() : "cv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            map.put("_id", id);
            map.put("variableId", id);
            map.put("name", dto.getName() != null ? dto.getName().trim() : "");
            map.put("variableType", dto.getVariableType() != null ? dto.getVariableType() : "short");
            map.put("isGlobal", dto.isGlobal());
            map.put("isBlind", dto.isBlind());
            map.put("rank", dto.getRank() >= 0 ? dto.getRank() : rank++);

            List<Map<String, Object>> opts = new ArrayList<>();
            if (dto.getOptions() != null) {
                for (StudyCustomVariableDto.VariableOptionDto opt : dto.getOptions()) {
                    Map<String, Object> oMap = new LinkedHashMap<>();
                    oMap.put("optionId", opt.getOptionId() != null && !opt.getOptionId().isBlank() ? opt.getOptionId() : "opt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
                    oMap.put("name", opt.getName() != null ? opt.getName() : "");
                    opts.add(oMap);
                }
            }
            map.put("options", opts);
            list.add(map);
        }
        return list;
    }

    private List<StudyVariableGroupDto> parseVariableGroups(Object raw) {
        List<StudyVariableGroupDto> groups = new ArrayList<>();
        if (!(raw instanceof List<?> list)) return groups;

        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                StudyVariableGroupDto dto = new StudyVariableGroupDto();
                dto.setId(map.get("_id") != null ? map.get("_id").toString() : (map.get("id") != null ? map.get("id").toString() : ""));
                dto.setName(map.get("name") != null ? map.get("name").toString() : "");
                dto.setCollapsed(Boolean.TRUE.equals(map.get("isCollapsed")));

                List<String> members = new ArrayList<>();
                if (map.get("members") instanceof List<?> mList) {
                    for (Object m : mList) {
                        if (m != null) members.add(m.toString());
                    }
                }
                dto.setMembers(members);
                groups.add(dto);
            }
        }
        return groups;
    }

    private List<Map<String, Object>> serializeVariableGroups(List<StudyVariableGroupDto> dtos) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (dtos == null) return list;

        for (StudyVariableGroupDto dto : dtos) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", dto.getId() != null && !dto.getId().isBlank() ? dto.getId() : "vg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            map.put("name", dto.getName() != null ? dto.getName().trim() : "");
            map.put("isCollapsed", dto.isCollapsed());
            map.put("members", dto.getMembers() != null ? dto.getMembers() : new ArrayList<>());
            list.add(map);
        }
        return list;
    }

    private List<StudyLayoutItemDto> parseLayoutItems(
            Object raw,
            List<StudyCustomVariableDto> cvs,
            List<StudyVariableGroupDto> vgs
    ) {
        List<StudyLayoutItemDto> layout = new ArrayList<>();
        if (raw instanceof List<?> list && !list.isEmpty()) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    StudyLayoutItemDto dto = new StudyLayoutItemDto();
                    dto.setId(map.get("_id") != null ? map.get("_id").toString() : (map.get("id") != null ? map.get("id").toString() : ""));
                    dto.setType(map.get("type") != null ? map.get("type").toString() : "variable");
                    dto.setRefId(map.get("refId") != null ? map.get("refId").toString() : "");
                    dto.setRank(map.get("rank") instanceof Number n ? n.intValue() : layout.size());
                    layout.add(dto);
                }
            }
            return layout;
        }

        // If no persisted layout, build default layout: groups first, then ungrouped variables
        Set<String> groupedVarIds = new HashSet<>();
        for (StudyVariableGroupDto g : vgs) {
            groupedVarIds.addAll(g.getMembers());
        }

        int rank = 0;
        for (StudyVariableGroupDto g : vgs) {
            layout.add(new StudyLayoutItemDto("lay_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16), "group", g.getId(), rank++));
        }
        for (StudyCustomVariableDto v : cvs) {
            if (!groupedVarIds.contains(v.getId())) {
                layout.add(new StudyLayoutItemDto("lay_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16), "variable", v.getId(), rank++));
            }
        }
        return layout;
    }

    private List<Map<String, Object>> serializeLayoutItems(List<StudyLayoutItemDto> dtos) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (dtos == null) return list;

        int rank = 0;
        for (StudyLayoutItemDto dto : dtos) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", dto.getId() != null && !dto.getId().isBlank() ? dto.getId() : "lay_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            map.put("type", dto.getType() != null ? dto.getType() : "variable");
            map.put("refId", dto.getRefId() != null ? dto.getRefId() : "");
            map.put("rank", dto.getRank() >= 0 ? dto.getRank() : rank++);
            list.add(map);
        }
        return list;
    }

    private List<ContactTaxonomyDto> parseContactTaxonomy(Object raw, String fieldName, List<String> defaultValues) {
        List<ContactTaxonomyDto> result = new ArrayList<>();
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    String id = map.get("_id") != null ? map.get("_id").toString() : (map.get("id") != null ? map.get("id").toString() : "");
                    String val = map.get(fieldName) != null ? map.get(fieldName).toString() : (map.get("value") != null ? map.get("value").toString() : "");
                    if (!val.isBlank()) {
                        result.add(new ContactTaxonomyDto(id, val));
                    }
                }
            }
            return result;
        }

        // Initialize defaults with "Other" guaranteed only when not configured yet (raw == null)
        if (raw == null && defaultValues != null) {
            int idx = 1;
            for (String def : defaultValues) {
                result.add(new ContactTaxonomyDto("tax_" + (idx++), def));
            }
        }
        return result;
    }

    private List<Map<String, Object>> serializeContactTaxonomy(List<ContactTaxonomyDto> dtos, String fieldName) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (dtos == null) return list;

        for (ContactTaxonomyDto dto : dtos) {
            if (dto.getValue() == null || dto.getValue().trim().isEmpty()) continue;
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", dto.getId() != null && !dto.getId().isBlank() ? dto.getId() : "tax_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            map.put(fieldName, dto.getValue().trim());
            map.put("value", dto.getValue().trim());
            list.add(map);
        }
        return list;
    }
}
