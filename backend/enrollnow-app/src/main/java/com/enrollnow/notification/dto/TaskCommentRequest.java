package com.enrollnow.notification.dto;

import jakarta.validation.constraints.NotBlank;

public class TaskCommentRequest {

    @NotBlank(message = "Comment must not be blank")
    private String comment;

    public TaskCommentRequest() {
    }

    public TaskCommentRequest(String comment) {
        this.comment = comment;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
