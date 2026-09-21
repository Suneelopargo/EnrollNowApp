package com.enrollnow.dashboard.dto;

public class RecentActivityDto {
    private Long id;
    private String eventType;
    private String description;
    private String timestamp;
    private String performedBy;

    public RecentActivityDto() {}

    public RecentActivityDto(Long id, String eventType, String description, String timestamp, String performedBy) {
        this.id = id;
        this.eventType = eventType;
        this.description = description;
        this.timestamp = timestamp;
        this.performedBy = performedBy;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
}
