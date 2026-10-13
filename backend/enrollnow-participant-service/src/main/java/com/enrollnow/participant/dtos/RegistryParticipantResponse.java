package com.enrollnow.participant.dtos;

import com.enrollnow.participant.models.ParticipantVariable;
import com.enrollnow.participant.models.StudyInfo;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class RegistryParticipantResponse {
    private UUID id;
    private String globalId;
    private String firstName;
    private String middleName;
    private String lastName;
    private String name;
    private String sex;
    private LocalDate birthday;
    private Integer age;
    private String ethnicity;
    private String race;
    private String familyId;
    private String timezone;
    private boolean contactForFutureStudies;
    private boolean availableToAddStudy;
    private OffsetDateTime globalLastContactDate;
    private OffsetDateTime insertedAt;
    private String city;
    private String state;
    private String zipcode;
    private String phone;
    private List<String> tags;
    private List<StudyInfo> studies;
    private List<ParticipantVariable> variables;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getGlobalId() { return globalId; }
    public void setGlobalId(String globalId) { this.globalId = globalId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSex() { return sex; }
    public void setSex(String sex) { this.sex = sex; }
    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getEthnicity() { return ethnicity; }
    public void setEthnicity(String ethnicity) { this.ethnicity = ethnicity; }
    public String getRace() { return race; }
    public void setRace(String race) { this.race = race; }
    public String getFamilyId() { return familyId; }
    public void setFamilyId(String familyId) { this.familyId = familyId; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public boolean isContactForFutureStudies() { return contactForFutureStudies; }
    public void setContactForFutureStudies(boolean value) { this.contactForFutureStudies = value; }
    public boolean isAvailableToAddStudy() { return availableToAddStudy; }
    public void setAvailableToAddStudy(boolean value) { this.availableToAddStudy = value; }
    public OffsetDateTime getGlobalLastContactDate() { return globalLastContactDate; }
    public void setGlobalLastContactDate(OffsetDateTime value) { this.globalLastContactDate = value; }
    public OffsetDateTime getInsertedAt() { return insertedAt; }
    public void setInsertedAt(OffsetDateTime value) { this.insertedAt = value; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getZipcode() { return zipcode; }
    public void setZipcode(String zipcode) { this.zipcode = zipcode; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public List<StudyInfo> getStudies() { return studies; }
    public void setStudies(List<StudyInfo> studies) { this.studies = studies; }
    public List<ParticipantVariable> getVariables() { return variables; }
    public void setVariables(List<ParticipantVariable> variables) { this.variables = variables; }
}
