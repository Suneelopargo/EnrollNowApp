package com.enrollnow.participant.dtos;

public class DemographicsDto {
    private String dob;
    private String gender;
    private String ethnicity;
    private String race;
    private String primaryLanguage;

    public DemographicsDto() {
    }

    public DemographicsDto(String dob, String gender, String ethnicity, String race, String primaryLanguage) {
        this.dob = dob;
        this.gender = gender;
        this.ethnicity = ethnicity;
        this.race = race;
        this.primaryLanguage = primaryLanguage;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getEthnicity() {
        return ethnicity;
    }

    public void setEthnicity(String ethnicity) {
        this.ethnicity = ethnicity;
    }

    public String getRace() {
        return race;
    }

    public void setRace(String race) {
        this.race = race;
    }

    public String getPrimaryLanguage() {
        return primaryLanguage;
    }

    public void setPrimaryLanguage(String primaryLanguage) {
        this.primaryLanguage = primaryLanguage;
    }
}
