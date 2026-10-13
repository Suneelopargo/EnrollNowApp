package com.enrollnow.participant.dtos;

public class RegistryExportResponse {
    private String status;
    private long participantCount;
    private String message;

    public RegistryExportResponse() {}
    public RegistryExportResponse(String status, long participantCount, String message) {
        this.status = status; this.participantCount = participantCount; this.message = message;
    }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public long getParticipantCount() { return participantCount; }
    public void setParticipantCount(long v) { participantCount = v; }
    public String getMessage() { return message; }
    public void setMessage(String v) { message = v; }
}
