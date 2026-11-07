package com.enrollnow.notification.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateTaskStatusRequest {

    @NotBlank(message = "Status must not be blank")
    private String status;

    public UpdateTaskStatusRequest() {
    }

    public UpdateTaskStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
