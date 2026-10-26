package com.enrollnow.study.dtos;

import java.util.List;

public class UpdateStudyRequirementsRequest {

    private Integer sampleSize;
    private List<DemographicGroupDto> studyGroups;
    private List<StudyCustomVariableDto> customVariables;
    private List<StudyVariableGroupDto> variableGroups;
    private List<StudyLayoutItemDto> customVariableLayout;
    private List<ContactTaxonomyDto> contactRelationships;
    private List<ContactTaxonomyDto> contactOutcomes;

    public UpdateStudyRequirementsRequest() {
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }

    public List<DemographicGroupDto> getStudyGroups() {
        return studyGroups;
    }

    public void setStudyGroups(List<DemographicGroupDto> studyGroups) {
        this.studyGroups = studyGroups;
    }

    public List<StudyCustomVariableDto> getCustomVariables() {
        return customVariables;
    }

    public void setCustomVariables(List<StudyCustomVariableDto> customVariables) {
        this.customVariables = customVariables;
    }

    public List<StudyVariableGroupDto> getVariableGroups() {
        return variableGroups;
    }

    public void setVariableGroups(List<StudyVariableGroupDto> variableGroups) {
        this.variableGroups = variableGroups;
    }

    public List<StudyLayoutItemDto> getCustomVariableLayout() {
        return customVariableLayout;
    }

    public void setCustomVariableLayout(List<StudyLayoutItemDto> customVariableLayout) {
        this.customVariableLayout = customVariableLayout;
    }

    public List<ContactTaxonomyDto> getContactRelationships() {
        return contactRelationships;
    }

    public void setContactRelationships(List<ContactTaxonomyDto> contactRelationships) {
        this.contactRelationships = contactRelationships;
    }

    public List<ContactTaxonomyDto> getContactOutcomes() {
        return contactOutcomes;
    }

    public void setContactOutcomes(List<ContactTaxonomyDto> contactOutcomes) {
        this.contactOutcomes = contactOutcomes;
    }
}
