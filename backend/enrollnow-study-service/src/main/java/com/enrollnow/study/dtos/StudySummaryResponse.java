package com.enrollnow.study.dtos;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StudySummaryResponse {

    private UUID id;
    private String studyCode;
    private String name;
    private String description;
    private boolean archived;

    private Integer sampleSize;
    private Integer enrolled;

    private LocalDate startDate;
    private LocalDate endDate;
    private List<StudyAdminSummary> admins = new ArrayList<>();

    public StudySummaryResponse() {
    }

    public StudySummaryResponse(UUID id, String studyCode, String name, String description, boolean archived) {
        this.id = id;
        this.studyCode = studyCode;
        this.name = name;
        this.description = description;
        this.archived = archived;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getStudyId() {
        return id != null ? id.toString() : studyCode;
    }

    public String getStudyCode() {
        return studyCode;
    }

    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
    }

    public String getProtocolNumber() {
        return studyCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public String getStatus() {
        return archived ? "COMPLETED" : "ACTIVE";
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }

    public Integer getTargetEnrollment() {
        return sampleSize;
    }

    public Integer getEnrolled() {
        return enrolled;
    }

    public void setEnrolled(Integer enrolled) {
        this.enrolled = enrolled;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getRecruitmentStartDate() {
        return startDate;
    }

    public void setRecruitmentStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getRecruitmentEndDate() {
        return endDate;
    }

    public void setRecruitmentEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public List<StudyAdminSummary> getAdmins() {
        return admins != null ? admins : new ArrayList<>();
    }

    public void setAdmins(List<StudyAdminSummary> admins) {
        this.admins = admins != null ? admins : new ArrayList<>();
    }
}
