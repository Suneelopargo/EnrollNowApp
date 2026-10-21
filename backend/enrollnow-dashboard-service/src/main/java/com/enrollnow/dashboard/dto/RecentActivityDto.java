package com.enrollnow.dashboard.dto;

public class RecentActivityDto {

    private Long id;
    private String activityType;
    private String description;
    private String timestamp;
    private String actor;

    public RecentActivityDto() {}

    public RecentActivityDto(Long id, String activityType, String description, String timestamp, String actor) {
        this.id = id;
        this.activityType = activityType;
        this.description = description;
        this.timestamp = timestamp;
        this.actor = actor;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
}
