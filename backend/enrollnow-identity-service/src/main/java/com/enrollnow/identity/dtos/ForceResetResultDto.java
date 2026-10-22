package com.enrollnow.identity.dtos;

public class ForceResetResultDto {

    private int totalAffected;
    private int emailsSent;
    private int emailsFailed;
    private String message;

    public ForceResetResultDto() {
    }

    public ForceResetResultDto(int totalAffected, int emailsSent, int emailsFailed, String message) {
        this.totalAffected = totalAffected;
        this.emailsSent = emailsSent;
        this.emailsFailed = emailsFailed;
        this.message = message;
    }

    public int getTotalAffected() {
        return totalAffected;
    }

    public void setTotalAffected(int totalAffected) {
        this.totalAffected = totalAffected;
    }

    public int getEmailsSent() {
        return emailsSent;
    }

    public void setEmailsSent(int emailsSent) {
        this.emailsSent = emailsSent;
    }

    public int getEmailsFailed() {
        return emailsFailed;
    }

    public void setEmailsFailed(int emailsFailed) {
        this.emailsFailed = emailsFailed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
