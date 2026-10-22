package com.enrollnow.participant.dtos;

import java.util.List;

public class RegistryParticipantDto {
    private String id;
    private String name;
    private String firstName;
    private String lastName;
    private List<StudyItemDto> studies;
    private String gender;
    private String age;
    private Integer ageNumeric;
    private String lastContact;
    private String status;
    private String city;
    private String state;
    private String zipcode;
    private String phone;
    private String familyId;
    private String dateCreated;
    private String globalId;
    private String timezone;
    private List<String> tags;
    private Boolean contactForFutureStudies;
    private Boolean availableToAddStudy;
    private String globalDateOfLastContact;
    private String birthMonth;
    private ContactMethodsDto contactMethods;
    private DemographicsDto demographics;
    private FamilyInfoDto family;
    private List<ParticipantVariableDto> variables;

    public RegistryParticipantDto() {
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

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public List<StudyItemDto> getStudies() {
        return studies;
    }

    public void setStudies(List<StudyItemDto> studies) {
        this.studies = studies;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public Integer getAgeNumeric() {
        return ageNumeric;
    }

    public void setAgeNumeric(Integer ageNumeric) {
        this.ageNumeric = ageNumeric;
    }

    public String getLastContact() {
        return lastContact;
    }

    public void setLastContact(String lastContact) {
        this.lastContact = lastContact;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getZipcode() {
        return zipcode;
    }

    public void setZipcode(String zipcode) {
        this.zipcode = zipcode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFamilyId() {
        return familyId;
    }

    public void setFamilyId(String familyId) {
        this.familyId = familyId;
    }

    public String getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(String dateCreated) {
        this.dateCreated = dateCreated;
    }

    public String getGlobalId() {
        return globalId;
    }

    public void setGlobalId(String globalId) {
        this.globalId = globalId;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public Boolean getContactForFutureStudies() {
        return contactForFutureStudies;
    }

    public void setContactForFutureStudies(Boolean contactForFutureStudies) {
        this.contactForFutureStudies = contactForFutureStudies;
    }

    public Boolean getAvailableToAddStudy() {
        return availableToAddStudy;
    }

    public void setAvailableToAddStudy(Boolean availableToAddStudy) {
        this.availableToAddStudy = availableToAddStudy;
    }

    public String getGlobalDateOfLastContact() {
        return globalDateOfLastContact;
    }

    public void setGlobalDateOfLastContact(String globalDateOfLastContact) {
        this.globalDateOfLastContact = globalDateOfLastContact;
    }

    public String getBirthMonth() {
        return birthMonth;
    }

    public void setBirthMonth(String birthMonth) {
        this.birthMonth = birthMonth;
    }

    public ContactMethodsDto getContactMethods() {
        return contactMethods;
    }

    public void setContactMethods(ContactMethodsDto contactMethods) {
        this.contactMethods = contactMethods;
    }

    public DemographicsDto getDemographics() {
        return demographics;
    }

    public void setDemographics(DemographicsDto demographics) {
        this.demographics = demographics;
    }

    public FamilyInfoDto getFamily() {
        return family;
    }

    public void setFamily(FamilyInfoDto family) {
        this.family = family;
    }

    public List<ParticipantVariableDto> getVariables() {
        return variables;
    }

    public void setVariables(List<ParticipantVariableDto> variables) {
        this.variables = variables;
    }
}
