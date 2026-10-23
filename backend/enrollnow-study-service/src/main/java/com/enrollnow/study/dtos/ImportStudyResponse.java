package com.enrollnow.study.dtos;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class ImportStudyResponse {

    private UUID studyId;
    private String studyCode;
    private String name;
    private String message;
    private Map<String, Integer> importedEntitiesSummary;
    private List<String> unsupportedFeatures;

    public ImportStudyResponse() {
    }

    public ImportStudyResponse(
            UUID studyId,
            String studyCode,
            String name,
            String message,
            Map<String, Integer> importedEntitiesSummary,
            List<String> unsupportedFeatures
    ) {
        this.studyId = studyId;
        this.studyCode = studyCode;
        this.name = name;
        this.message = message;
        this.importedEntitiesSummary = importedEntitiesSummary != null ? importedEntitiesSummary : Collections.emptyMap();
        this.unsupportedFeatures = unsupportedFeatures != null ? unsupportedFeatures : Collections.emptyList();
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public String getStudyCode() {
        return studyCode;
    }

    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Integer> getImportedEntitiesSummary() {
        return importedEntitiesSummary;
    }

    public void setImportedEntitiesSummary(Map<String, Integer> importedEntitiesSummary) {
        this.importedEntitiesSummary = importedEntitiesSummary;
    }

    public List<String> getUnsupportedFeatures() {
        return unsupportedFeatures;
    }

    public void setUnsupportedFeatures(List<String> unsupportedFeatures) {
        this.unsupportedFeatures = unsupportedFeatures;
    }
}
