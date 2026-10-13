package com.enrollnow.participant.dtos;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public class UpdateRegistryParticipantRequest {
    @NotBlank(message = "First name is required")
    private String firstName;
    private String middleName;
    @NotBlank(message = "Last name is required")
    private String lastName;
    private String globalId;
    private String sex;
    private LocalDate birthday;
    private String ethnicity;
    private String race;
    private String familyId;
    private String timezone;
    private Boolean contactForFutureStudies;
    private List<String> tags;
    private String city;
    private String state;
    private String zipcode;
    private String phone;

    public String getFirstName() { return firstName; }
    public void setFirstName(String v) { firstName = v; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String v) { middleName = v; }
    public String getLastName() { return lastName; }
    public void setLastName(String v) { lastName = v; }
    public String getGlobalId() { return globalId; }
    public void setGlobalId(String v) { globalId = v; }
    public String getSex() { return sex; }
    public void setSex(String v) { sex = v; }
    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate v) { birthday = v; }
    public String getEthnicity() { return ethnicity; }
    public void setEthnicity(String v) { ethnicity = v; }
    public String getRace() { return race; }
    public void setRace(String v) { race = v; }
    public String getFamilyId() { return familyId; }
    public void setFamilyId(String v) { familyId = v; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String v) { timezone = v; }
    public Boolean getContactForFutureStudies() { return contactForFutureStudies; }
    public void setContactForFutureStudies(Boolean v) { contactForFutureStudies = v; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> v) { tags = v; }
    public String getCity() { return city; }
    public void setCity(String v) { city = v; }
    public String getState() { return state; }
    public void setState(String v) { state = v; }
    public String getZipcode() { return zipcode; }
    public void setZipcode(String v) { zipcode = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { phone = v; }
}
