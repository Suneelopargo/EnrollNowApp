package com.enrollnow.participant.dtos;

public class ParticipantVariableDto {
    private String id;
    private String name;
    private String type; // text, number, date, single, multi
    private String value;
    private String lastUpdated;

    public ParticipantVariableDto() {
    }

    public ParticipantVariableDto(String name, String value, String lastUpdated) {
        this.name = name;
        this.value = value;
        this.lastUpdated = lastUpdated;
    }

    public ParticipantVariableDto(String id, String name, String type, String value, String lastUpdated) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.value = value;
        this.lastUpdated = lastUpdated;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
