package com.enrollnow.study.dtos;

import java.util.UUID;

public class StudyGrantDto {

    private UUID id;
    private String grantNumber;
    private String agency;

    public StudyGrantDto() {
    }

    public StudyGrantDto(UUID id, String grantNumber, String agency) {
        this.id = id;
        this.grantNumber = grantNumber;
        this.agency = agency;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getGrantNumber() {
        return grantNumber;
    }

    public void setGrantNumber(String grantNumber) {
        this.grantNumber = grantNumber;
    }

    public String getAgency() {
        return agency;
    }

    public void setAgency(String agency) {
        this.agency = agency;
    }
}
