package com.enrollnow.study.dtos;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StudyDetailsResponse {

    private UUID id;
    private UUID tenantId;
    private String studyCode;
    private String name;
    private String longName;
    private String description;
    private String irbId;
    private LocalDate recruitmentStartDate;
    private LocalDate recruitmentEndDate;
    private LocalDate completionDate;
    private Integer sampleSize;
    private String locale;
    private boolean allowParticipationInOtherStudies = true;
    private String studyUrlLabel;
    private String studyUrl;
    private boolean archived;
    private boolean canManage = false;
    private List<StudyGrantDto> grants = new ArrayList<>();

    public StudyDetailsResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
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

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public boolean isAllowParticipationInOtherStudies() {
        return allowParticipationInOtherStudies;
    }

    public void setAllowParticipationInOtherStudies(boolean allowParticipationInOtherStudies) {
        this.allowParticipationInOtherStudies = allowParticipationInOtherStudies;
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

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public boolean isCanManage() {
        return canManage;
    }

    public void setCanManage(boolean canManage) {
        this.canManage = canManage;
    }

    public List<StudyGrantDto> getGrants() {
        return grants;
    }

    public void setGrants(List<StudyGrantDto> grants) {
        this.grants = grants != null ? grants : new ArrayList<>();
    }
}
