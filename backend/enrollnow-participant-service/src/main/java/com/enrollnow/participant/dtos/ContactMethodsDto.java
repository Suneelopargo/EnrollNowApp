package com.enrollnow.participant.dtos;

public class ContactMethodsDto {
    private String primaryEmail;
    private String secondaryEmail;
    private String phone;
    private String address;
    private String preferredMethod;

    public ContactMethodsDto() {
    }

    public ContactMethodsDto(String primaryEmail, String secondaryEmail, String phone, String address, String preferredMethod) {
        this.primaryEmail = primaryEmail;
        this.secondaryEmail = secondaryEmail;
        this.phone = phone;
        this.address = address;
        this.preferredMethod = preferredMethod;
    }

    public String getPrimaryEmail() {
        return primaryEmail;
    }

    public void setPrimaryEmail(String primaryEmail) {
        this.primaryEmail = primaryEmail;
    }

    public String getSecondaryEmail() {
        return secondaryEmail;
    }

    public void setSecondaryEmail(String secondaryEmail) {
        this.secondaryEmail = secondaryEmail;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPreferredMethod() {
        return preferredMethod;
    }

    public void setPreferredMethod(String preferredMethod) {
        this.preferredMethod = preferredMethod;
    }
}
