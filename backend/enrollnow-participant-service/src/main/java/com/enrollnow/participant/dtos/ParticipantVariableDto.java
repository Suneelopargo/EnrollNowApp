package com.enrollnow.participant.dtos;

public class ParticipantVariableDto {
    private String name;
    private String value;
    private String lastUpdated;

    public ParticipantVariableDto() {
    }

    public ParticipantVariableDto(String name, String value, String lastUpdated) {
        this.name = name;
        this.value = value;
        this.lastUpdated = lastUpdated;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
