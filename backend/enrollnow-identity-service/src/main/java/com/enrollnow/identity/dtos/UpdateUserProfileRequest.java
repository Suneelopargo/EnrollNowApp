package com.enrollnow.identity.dtos;

import jakarta.validation.constraints.Size;

public class UpdateUserProfileRequest {

    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @Size(max = 100, message = "First Name must not exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last Name must not exceed 100 characters")
    private String lastName;

    @Size(max = 50, message = "Phone Number must not exceed 50 characters")
    private String phoneNumber;

    @Size(max = 100, message = "Timezone must not exceed 100 characters")
    private String timezone;

    private Boolean ignoreTimezoneMismatch;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Boolean getIgnoreTimezoneMismatch() {
        return ignoreTimezoneMismatch;
    }

    public void setIgnoreTimezoneMismatch(Boolean ignoreTimezoneMismatch) {
        this.ignoreTimezoneMismatch = ignoreTimezoneMismatch;
    }
}
