package com.enrollnow.participant.dtos;

import jakarta.validation.constraints.NotBlank;

public class UpdateCommentRequest {
    @NotBlank(message = "Comment text is required")
    private String text;
    private Boolean pinned;

    public UpdateCommentRequest() {}

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Boolean getPinned() { return pinned; }
    public void setPinned(Boolean pinned) { this.pinned = pinned; }
}
