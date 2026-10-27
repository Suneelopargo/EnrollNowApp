package com.enrollnow.participant.dtos;

import java.util.UUID;

public class SurveyOptionDto {
    private UUID surveyDefinitionId;
    private String code;
    private String name;
    private String description;

    public SurveyOptionDto() {}

    public SurveyOptionDto(UUID surveyDefinitionId, String code, String name, String description) {
        this.surveyDefinitionId = surveyDefinitionId;
        this.code = code;
        this.name = name;
        this.description = description;
    }

    public UUID getSurveyDefinitionId() { return surveyDefinitionId; }
    public void setSurveyDefinitionId(UUID surveyDefinitionId) { this.surveyDefinitionId = surveyDefinitionId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
