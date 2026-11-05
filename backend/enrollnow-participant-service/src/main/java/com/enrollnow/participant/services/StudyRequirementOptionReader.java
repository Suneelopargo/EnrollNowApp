package com.enrollnow.participant.services;

import com.enrollnow.study.models.StudyRequirement;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

final class StudyRequirementOptionReader {

    private static final Logger log = LoggerFactory.getLogger(StudyRequirementOptionReader.class);

    private StudyRequirementOptionReader() {
    }

    static List<String> read(
            StudyRequirementRepository repository,
            ObjectMapper objectMapper,
            UUID tenantId,
            UUID studyId,
            String category,
            String fieldName
    ) {
        if (repository == null || objectMapper == null || tenantId == null) {
            return List.of();
        }

        List<StudyRequirement> requirements = studyId == null
                ? repository.findByTenantId(tenantId)
                : repository.findByTenantIdAndStudyId(tenantId, studyId).map(List::of).orElseGet(List::of);
        if (requirements.isEmpty()) {
            return List.of();
        }

        Map<String, String> unique = new LinkedHashMap<>();
        for (StudyRequirement requirement : requirements) {
            String configuration = requirement.getConfiguration();
            if (configuration == null || configuration.isBlank()) {
                continue;
            }

            Map<String, Object> config;
            try {
                config = objectMapper.readValue(configuration, new TypeReference<>() {});
            } catch (JsonProcessingException ex) {
                log.warn("Unable to read {} options for study {}: {}",
                        category, requirement.getStudyId(), ex.getMessage());
                continue;
            }

            Object rawOptions = config.get(category);
            if (rawOptions instanceof List<?> options) {
                for (Object option : options) {
                    if (!(option instanceof Map<?, ?> optionMap)) {
                        continue;
                    }
                    String value = firstValue(optionMap, fieldName);
                    if (!value.isEmpty()) {
                        unique.putIfAbsent(value.toLowerCase(java.util.Locale.ROOT), value);
                    }
                }
            }
        }
        return new ArrayList<>(unique.values());
    }

    private static String firstValue(Map<?, ?> option, String fieldName) {
        for (String key : List.of(fieldName, "value", "name")) {
            Object value = option.get(key);
            if (value != null && !value.toString().isBlank()) {
                return value.toString().trim();
            }
        }
        return "";
    }
}
