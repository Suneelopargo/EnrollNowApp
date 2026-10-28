package com.enrollnow.participant.dtos;

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

    public boolean isPreferred() {
        return isPreferred;
    }

    public void setPreferred(boolean preferred) {
        isPreferred = preferred;
    }
}
