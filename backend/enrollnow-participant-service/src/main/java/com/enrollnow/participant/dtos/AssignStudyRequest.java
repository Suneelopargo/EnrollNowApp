package com.enrollnow.participant.dtos;

import java.util.List;
import java.util.UUID;

public class AssignStudyRequest {
    private UUID participantId;
    private List<UUID> participantIds;
    private UUID studyId;
    private String studyName;
    private String status; // e.g. "CANDIDATE", "ENROLLED", "REFERRED"
    private String notes;

    public AssignStudyRequest() {
    }

    public AssignStudyRequest(UUID participantId, UUID studyId, String status, String notes) {
        this.participantId = participantId;
        this.studyId = studyId;
        this.status = status;
        this.notes = notes;
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public List<UUID> getParticipantIds() {
        return participantIds;
    }

    public void setParticipantIds(List<UUID> participantIds) {
        this.participantIds = participantIds;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public String getStudyName() {
        return studyName;
    }

    public void setStudyName(String studyName) {
        this.studyName = studyName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
