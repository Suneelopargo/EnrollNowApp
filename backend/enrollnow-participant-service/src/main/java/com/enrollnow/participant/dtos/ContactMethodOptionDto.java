package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ContactMethodOptionDto {

    private String label;
    private String value;
    private boolean isPreferred;

    public ContactMethodOptionDto() {
    }

    public ContactMethodOptionDto(String label, String value, boolean isPreferred) {
        this.label = label;
        this.value = value;
        this.isPreferred = isPreferred;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    @JsonIgnore
    public boolean isPreferred() {
        return isPreferred;
    }

    @JsonIgnore
    public void setPreferred(boolean preferred) {
        isPreferred = preferred;
    }

    @JsonProperty("isPreferred")
    public boolean getIsPreferred() {
        return isPreferred;
    }

    @JsonProperty("isPreferred")
    @JsonAlias({"preferred"})
    public void setIsPreferred(boolean preferred) {
        isPreferred = preferred;
    }
}
