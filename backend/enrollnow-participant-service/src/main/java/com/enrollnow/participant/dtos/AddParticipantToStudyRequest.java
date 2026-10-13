package com.enrollnow.participant.dtos;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AddParticipantToStudyRequest {
    @NotNull(message = "Study ID is required")
    private UUID studyId;
    private UUID statusId;
    private String statusName;

    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID v) { studyId = v; }
    public UUID getStatusId() { return statusId; }
    public void setStatusId(UUID v) { statusId = v; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String v) { statusName = v; }
}
