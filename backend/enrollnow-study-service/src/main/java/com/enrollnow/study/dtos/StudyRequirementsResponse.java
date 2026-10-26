package com.enrollnow.study.dtos;

import java.util.ArrayList;
import java.util.List;

public class StudyRequirementsResponse {

    private String studyId;
    private Integer sampleSize;
    private List<StudyMilestoneDto> milestones = new ArrayList<>();
    private List<DemographicGroupDto> studyGroups = new ArrayList<>();
    private List<StudyCustomVariableDto> customVariables = new ArrayList<>();
    private List<StudyVariableGroupDto> variableGroups = new ArrayList<>();
    private List<StudyLayoutItemDto> customVariableLayout = new ArrayList<>();
    private List<ContactTaxonomyDto> contactRelationships = new ArrayList<>();
    private List<ContactTaxonomyDto> contactOutcomes = new ArrayList<>();
    private List<StudyCustomVariableDto> globalVariables = new ArrayList<>();
    private boolean canManage;

    public StudyRequirementsResponse() {
    }

    public String getStudyId() {
        return studyId;
    }

    public void setStudyId(String studyId) {
        this.studyId = studyId;
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }

    public List<StudyMilestoneDto> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<StudyMilestoneDto> milestones) {
        this.milestones = milestones != null ? milestones : new ArrayList<>();
    }

    public List<DemographicGroupDto> getStudyGroups() {
        return studyGroups;
    }

    public void setStudyGroups(List<DemographicGroupDto> studyGroups) {
        this.studyGroups = studyGroups != null ? studyGroups : new ArrayList<>();
    }

    public List<StudyCustomVariableDto> getCustomVariables() {
        return customVariables;
    }

    public void setCustomVariables(List<StudyCustomVariableDto> customVariables) {
        this.customVariables = customVariables != null ? customVariables : new ArrayList<>();
    }

    public List<StudyVariableGroupDto> getVariableGroups() {
        return variableGroups;
    }

    public void setVariableGroups(List<StudyVariableGroupDto> variableGroups) {
        this.variableGroups = variableGroups != null ? variableGroups : new ArrayList<>();
    }

    public List<StudyLayoutItemDto> getCustomVariableLayout() {
        return customVariableLayout;
    }

    public void setCustomVariableLayout(List<StudyLayoutItemDto> customVariableLayout) {
        this.customVariableLayout = customVariableLayout != null ? customVariableLayout : new ArrayList<>();
    }

    public List<ContactTaxonomyDto> getContactRelationships() {
        return contactRelationships;
    }

    public void setContactRelationships(List<ContactTaxonomyDto> contactRelationships) {
        this.contactRelationships = contactRelationships != null ? contactRelationships : new ArrayList<>();
    }

    public List<ContactTaxonomyDto> getContactOutcomes() {
        return contactOutcomes;
    }

    public void setContactOutcomes(List<ContactTaxonomyDto> contactOutcomes) {
        this.contactOutcomes = contactOutcomes != null ? contactOutcomes : new ArrayList<>();
    }

    public List<StudyCustomVariableDto> getGlobalVariables() {
        return globalVariables;
    }

    public void setGlobalVariables(List<StudyCustomVariableDto> globalVariables) {
        this.globalVariables = globalVariables != null ? globalVariables : new ArrayList<>();
    }

    public boolean isCanManage() {
        return canManage;
    }

    public void setCanManage(boolean canManage) {
        this.canManage = canManage;
    }
}
