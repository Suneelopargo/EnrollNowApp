package com.enrollnow.participant.models;

import java.time.OffsetDateTime;

public class ParticipantLog {
    private String id;
    private String type;
    private String message;
    private String userId;
    private String userName;
    private OffsetDateTime timestamp;
    private String status;
    private String fileUrl;

    public ParticipantLog() {}

    public ParticipantLog(String id, String type, String message, String userId, String userName,
                          OffsetDateTime timestamp, String status, String fileUrl) {
        this.id = id;
        this.type = type;
        this.message = message;
        this.userId = userId;
        this.userName = userName;
        this.timestamp = timestamp;
        this.status = status;
        this.fileUrl = fileUrl;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public OffsetDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
}
