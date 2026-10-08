package com.enrollnow.identity.dtos;

import java.util.UUID;

public class UserSummaryResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String title;
    private String status;
    private String primaryEmail;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(
            UUID id,
            String firstName,
            String lastName,
            String title,
            String status,
            String primaryEmail
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.title = title;
        this.status = status;
        this.primaryEmail = primaryEmail;
    }

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPrimaryEmail() {
        return primaryEmail;
    }

    public void setPrimaryEmail(String primaryEmail) {
        this.primaryEmail = primaryEmail;
    }
}