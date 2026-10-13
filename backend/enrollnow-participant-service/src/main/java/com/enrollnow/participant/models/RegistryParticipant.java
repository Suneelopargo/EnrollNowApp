package com.enrollnow.participant.models;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Temporary domain model for Phase 8A. It intentionally does not contain JPA annotations.
 * The final relational model will be created after the real database/schema is supplied.
 */
public class RegistryParticipant {
    private UUID id;
    private UUID tenantId;
    private String globalId;
    private String firstName;
    private String middleName;
    private String lastName;
    private String sex;
    private LocalDate birthday;
    private String ethnicity;
    private String race;
    private String familyId;
    private String timezone;
    private boolean contactForFutureStudies;
    private OffsetDateTime globalLastContactDate;
    private OffsetDateTime insertedAt;
    private UUID insertedBy;
    private List<String> tags = new ArrayList<>();
    private List<StudyInfo> studies = new ArrayList<>();
    private List<ParticipantVariable> variables = new ArrayList<>();
    private List<ParticipantLog> contactLogs = new ArrayList<>();
    private List<ParticipantLog> textLogs = new ArrayList<>();
    private List<ParticipantLog> emailLogs = new ArrayList<>();
    private List<ParticipantLog> consentLogs = new ArrayList<>();
    private List<SurveySubmission> surveySubmissions = new ArrayList<>();
    private List<String> phones = new ArrayList<>();
    private List<String> emails = new ArrayList<>();
    private String city;
    private String state;
    private String zipcode;
    private String address1;
    private String address2;
    private boolean deleted;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public String getGlobalId() { return globalId; }
    public void setGlobalId(String globalId) { this.globalId = globalId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getSex() { return sex; }
    public void setSex(String sex) { this.sex = sex; }
    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public String getEthnicity() { return ethnicity; }
    public void setEthnicity(String ethnicity) { this.ethnicity = ethnicity; }
    public String getRace() { return race; }
    public void setRace(String race) { this.race = race; }
    public String getFamilyId() { return familyId; }
    public void setFamilyId(String familyId) { this.familyId = familyId; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public boolean isContactForFutureStudies() { return contactForFutureStudies; }
    public void setContactForFutureStudies(boolean contactForFutureStudies) { this.contactForFutureStudies = contactForFutureStudies; }
    public OffsetDateTime getGlobalLastContactDate() { return globalLastContactDate; }
    public void setGlobalLastContactDate(OffsetDateTime globalLastContactDate) { this.globalLastContactDate = globalLastContactDate; }
    public OffsetDateTime getInsertedAt() { return insertedAt; }
    public void setInsertedAt(OffsetDateTime insertedAt) { this.insertedAt = insertedAt; }
    public UUID getInsertedBy() { return insertedBy; }
    public void setInsertedBy(UUID insertedBy) { this.insertedBy = insertedBy; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags == null ? new ArrayList<>() : tags; }
    public List<StudyInfo> getStudies() { return studies; }
    public void setStudies(List<StudyInfo> studies) { this.studies = studies == null ? new ArrayList<>() : studies; }
    public List<ParticipantVariable> getVariables() { return variables; }
    public void setVariables(List<ParticipantVariable> variables) { this.variables = variables == null ? new ArrayList<>() : variables; }
    public List<ParticipantLog> getContactLogs() { return contactLogs; }
    public void setContactLogs(List<ParticipantLog> logs) { this.contactLogs = logs == null ? new ArrayList<>() : logs; }
    public List<ParticipantLog> getTextLogs() { return textLogs; }
    public void setTextLogs(List<ParticipantLog> logs) { this.textLogs = logs == null ? new ArrayList<>() : logs; }
    public List<ParticipantLog> getEmailLogs() { return emailLogs; }
    public void setEmailLogs(List<ParticipantLog> logs) { this.emailLogs = logs == null ? new ArrayList<>() : logs; }
    public List<ParticipantLog> getConsentLogs() { return consentLogs; }
    public void setConsentLogs(List<ParticipantLog> logs) { this.consentLogs = logs == null ? new ArrayList<>() : logs; }
    public List<SurveySubmission> getSurveySubmissions() { return surveySubmissions; }
    public void setSurveySubmissions(List<SurveySubmission> submissions) { this.surveySubmissions = submissions == null ? new ArrayList<>() : submissions; }
    public List<String> getPhones() { return phones; }
    public void setPhones(List<String> phones) { this.phones = phones == null ? new ArrayList<>() : phones; }
    public List<String> getEmails() { return emails; }
    public void setEmails(List<String> emails) { this.emails = emails == null ? new ArrayList<>() : emails; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getZipcode() { return zipcode; }
    public void setZipcode(String zipcode) { this.zipcode = zipcode; }
    public String getAddress1() { return address1; }
    public void setAddress1(String address1) { this.address1 = address1; }
    public String getAddress2() { return address2; }
    public void setAddress2(String address2) { this.address2 = address2; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
