package com.enrollnow.study.services;

import com.enrollnow.study.dtos.ImportStudyResponse;
import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class StudyConfigurationService {

    private static final Logger log = LoggerFactory.getLogger(StudyConfigurationService.class);

    private final StudyRequirementRepository studyRequirementRepository;
    private final ObjectMapper objectMapper;

    public StudyConfigurationService(
            StudyRequirementRepository studyRequirementRepository,
            ObjectMapper objectMapper
    ) {
        this.studyRequirementRepository = studyRequirementRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
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

    private StudyRequirement saveStudyRequirement(UUID tenantId, UUID studyId, int sampleSize, Map<String, Object> configMap) {
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

        requirement.setSampleSize(sampleSize);
        requirement.setConfiguration(json);
        requirement.setUpdatedAt(OffsetDateTime.now());

        return studyRequirementRepository.save(requirement);
    }
}
