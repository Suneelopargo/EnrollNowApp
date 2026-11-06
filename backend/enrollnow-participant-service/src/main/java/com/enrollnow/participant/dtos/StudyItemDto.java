package com.enrollnow.participant.dtos;

import java.util.UUID;

public class StudyItemDto {
    private String name;
    private boolean isLink;
    private UUID studyId;
    private String studyCode;
    private String status;
    private String participantStudyId;
    private boolean archived;

    public StudyItemDto() {
    }

    public StudyItemDto(String name, boolean isLink) {
        this.name = name;
        this.isLink = isLink;
    }

    public StudyItemDto(String name, boolean isLink, UUID studyId, String studyCode) {
        this.name = name;
        this.isLink = isLink;
        this.studyId = studyId;
        this.studyCode = studyCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isIsLink() {
        return isLink;
    }

    public void setIsLink(boolean link) {
        isLink = link;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getParticipantStudyId() {
        return participantStudyId;
    }

    public void setParticipantStudyId(String participantStudyId) {
        this.participantStudyId = participantStudyId;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }
}
