package com.enrollnow.participant.models;

import java.time.OffsetDateTime;

public class ParticipantVariable {
    private String id;
    private String variableId;
    private String name;
    private String value;
    private OffsetDateTime lastUpdated;

    public ParticipantVariable() {}

    public ParticipantVariable(String id, String variableId, String name, String value) {
        this.id = id;
        this.variableId = variableId;
        this.name = name;
        this.value = value;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVariableId() { return variableId; }
    public void setVariableId(String variableId) { this.variableId = variableId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public OffsetDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(OffsetDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
