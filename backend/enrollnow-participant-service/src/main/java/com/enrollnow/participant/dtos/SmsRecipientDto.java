package com.enrollnow.participant.dtos;

public class SmsRecipientDto {
    private String phoneNumber;
    private String contactName;

    public SmsRecipientDto() {}

    public SmsRecipientDto(String phoneNumber, String contactName) {
        this.phoneNumber = phoneNumber;
        this.contactName = contactName;
    }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
}
