package com.enrollnow.administrator.dto;

import jakarta.validation.constraints.NotBlank;

public class ResetPasswordRequest {

    @NotBlank(message = "New password cannot be blank")
    private String newPassword;

    public ResetPasswordRequest() {}

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
