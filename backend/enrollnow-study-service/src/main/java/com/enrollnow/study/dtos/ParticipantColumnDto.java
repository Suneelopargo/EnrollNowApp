package com.enrollnow.study.dtos;

public class ParticipantColumnDto {

    private String label;
    private String value;
    private String cId;
    private String title;

    public ParticipantColumnDto() {
    }

    public ParticipantColumnDto(String label, String value) {
        this.label = label;
        this.value = value;
    }

    public ParticipantColumnDto(String label, String value, String cId, String title) {
        this.label = label;
        this.value = value;
        this.cId = cId;
        this.title = title;
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

    public String getcId() {
        return cId;
    }

    public void setcId(String cId) {
        this.cId = cId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
