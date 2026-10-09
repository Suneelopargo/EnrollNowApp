package com.enrollnow.usermanagement.dtos;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserListItemResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String title;
    private String primaryEmail;
    private String status;

    /*
     * Temporary until Site Permission model is finalized.
     */
    private String sitePermission;

    private List<UserStudyAccessResponse> studies = new ArrayList<>();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPrimaryEmail() {
        return primaryEmail;
    }

    public void setPrimaryEmail(String primaryEmail) {
        this.primaryEmail = primaryEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSitePermission() {
        return sitePermission;
    }

    public void setSitePermission(String sitePermission) {
        this.sitePermission = sitePermission;
    }

    public List<UserStudyAccessResponse> getStudies() {
        return studies;
    }

    public void setStudies(List<UserStudyAccessResponse> studies) {
        this.studies = studies;
    }
}