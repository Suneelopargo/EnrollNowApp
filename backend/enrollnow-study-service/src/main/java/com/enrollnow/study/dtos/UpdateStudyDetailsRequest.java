package com.enrollnow.study.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class UpdateStudyDetailsRequest {

    @NotBlank(message = "Short Study Name is required")
    @Size(max = 15, message = "Short Study Name must be 15 characters or less")
    @Pattern(regexp = "^[a-zA-Z0-9 ]+$", message = "Short Study Name may only contain alphanumeric characters and spaces")
    private String name;

    private String longName;

    private String description;

    @Size(max = 100, message = "IRB ID must be 100 characters or less")
    private String irbId;

    private LocalDate recruitmentStartDate;

    private LocalDate recruitmentEndDate;

    private LocalDate completionDate;

    private Boolean allowParticipationInOtherStudies;

    private Boolean customIdGenerationEnabled;

    @Size(max = 5, message = "Study Prefix must be 5 characters or less")
    @Pattern(regexp = "^[a-zA-Z0-9]*$", message = "Study Prefix may only contain alphanumeric characters")
    private String prefix;

    @Size(max = 100, message = "Study URL Label must be 100 characters or less")
    private String studyUrlLabel;

    private String studyUrl;

    private List<StudyGrantDto> grants = new ArrayList<>();

    public UpdateStudyDetailsRequest() {
    }

    public UpdateStudyDetailsRequest(
            String name,
            String longName,
            String description,
            String irbId,
            LocalDate recruitmentStartDate,
            LocalDate recruitmentEndDate,
            LocalDate completionDate,
            Boolean allowParticipationInOtherStudies,
            String studyUrlLabel,
            String studyUrl,
            List<StudyGrantDto> grants
    ) {
        this(name, longName, description, irbId, recruitmentStartDate, recruitmentEndDate,
                completionDate, allowParticipationInOtherStudies, false, null, studyUrlLabel, studyUrl, grants);
    }

    public UpdateStudyDetailsRequest(
            String name,
            String longName,
            String description,
            String irbId,
            LocalDate recruitmentStartDate,
            LocalDate recruitmentEndDate,
            LocalDate completionDate,
            Boolean allowParticipationInOtherStudies,
            Boolean customIdGenerationEnabled,
            String prefix,
            String studyUrlLabel,
            String studyUrl,
            List<StudyGrantDto> grants
    ) {
        this.name = name;
        this.longName = longName;
        this.description = description;
        this.irbId = irbId;
        this.recruitmentStartDate = recruitmentStartDate;
        this.recruitmentEndDate = recruitmentEndDate;
        this.completionDate = completionDate;
        this.allowParticipationInOtherStudies = allowParticipationInOtherStudies;
        this.customIdGenerationEnabled = customIdGenerationEnabled;
        this.prefix = prefix;
        this.studyUrlLabel = studyUrlLabel;
        this.studyUrl = studyUrl;
        this.grants = grants != null ? grants : new ArrayList<>();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLongName() {
        return longName;
    }

    public void setLongName(String longName) {
        this.longName = longName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIrbId() {
        return irbId;
    }

    public void setIrbId(String irbId) {
        this.irbId = irbId;
    }

    public LocalDate getRecruitmentStartDate() {
        return recruitmentStartDate;
    }

    public void setRecruitmentStartDate(LocalDate recruitmentStartDate) {
        this.recruitmentStartDate = recruitmentStartDate;
    }

    public LocalDate getRecruitmentEndDate() {
        return recruitmentEndDate;
    }

    public void setRecruitmentEndDate(LocalDate recruitmentEndDate) {
        this.recruitmentEndDate = recruitmentEndDate;
    }

    public LocalDate getCompletionDate() {
        return completionDate;
    }

    public void setCompletionDate(LocalDate completionDate) {
        this.completionDate = completionDate;
    }

    public Boolean getAllowParticipationInOtherStudies() {
        return allowParticipationInOtherStudies;
    }

    public void setAllowParticipationInOtherStudies(Boolean allowParticipationInOtherStudies) {
        this.allowParticipationInOtherStudies = allowParticipationInOtherStudies;
    }

    public Boolean getCustomIdGenerationEnabled() {
        return customIdGenerationEnabled;
    }

    public void setCustomIdGenerationEnabled(Boolean customIdGenerationEnabled) {
        this.customIdGenerationEnabled = customIdGenerationEnabled;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public String getStudyUrlLabel() {
        return studyUrlLabel;
    }

    public void setStudyUrlLabel(String studyUrlLabel) {
        this.studyUrlLabel = studyUrlLabel;
    }

    public String getStudyUrl() {
        return studyUrl;
    }

    public void setStudyUrl(String studyUrl) {
        this.studyUrl = studyUrl;
    }

    public List<StudyGrantDto> getGrants() {
        return grants;
    }

    public void setGrants(List<StudyGrantDto> grants) {
        this.grants = grants != null ? grants : new ArrayList<>();
    }
}
