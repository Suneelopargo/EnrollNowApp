package com.enrollnow.dashboard.dto;

public class SystemAlertDto {
    private String id;
    private String severity;
    private String message;
    private String timestamp;

    public SystemAlertDto() {}

    public SystemAlertDto(String id, String severity, String message, String timestamp) {
        this.id = id;
        this.severity = severity;
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
