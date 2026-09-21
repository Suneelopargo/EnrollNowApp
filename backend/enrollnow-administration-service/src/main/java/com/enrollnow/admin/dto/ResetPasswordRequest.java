package com.enrollnow.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class ResetPasswordRequest {
    @NotBlank(message = "New password is required")
    private String newPassword;

    public ResetPasswordRequest() {}

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
