package com.enrollnow.identity.dtos;

public class EmailStatusResponse {

    private String email;
    private boolean verified;
    private String pendingEmail;
    private boolean pendingVerification;

    public EmailStatusResponse() {
    }

    public EmailStatusResponse(String email, boolean verified, String pendingEmail, boolean pendingVerification) {
        this.email = email;
        this.verified = verified;
        this.pendingEmail = pendingEmail;
        this.pendingVerification = pendingVerification;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getPendingEmail() {
        return pendingEmail;
    }

    public void setPendingEmail(String pendingEmail) {
        this.pendingEmail = pendingEmail;
    }

    public boolean isPendingVerification() {
        return pendingVerification;
    }

    public void setPendingVerification(boolean pendingVerification) {
        this.pendingVerification = pendingVerification;
    }
}
