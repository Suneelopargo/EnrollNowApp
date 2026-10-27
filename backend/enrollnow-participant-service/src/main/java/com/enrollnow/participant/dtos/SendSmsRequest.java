package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class SendSmsRequest {
    @NotBlank(message = "Recipient phone number is required")
    private String toPhone;

    @NotBlank(message = "SMS body cannot be empty")
    private String body;

    private UUID studyId;
    private String studyIdentifier;

    public SendSmsRequest() {}

    public String getToPhone() { return toPhone; }
    public void setToPhone(String toPhone) { this.toPhone = toPhone; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
        if (studyId != null) {
            this.studyIdentifier = studyId.toString();
        }
    }

    @JsonSetter("studyId")
    public void setStudyIdFromRaw(Object raw) {
        if (raw == null) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        String str = raw.toString().trim();
        if (str.isEmpty()) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        try {
            this.studyId = UUID.fromString(str);
            this.studyIdentifier = str;
        } catch (IllegalArgumentException e) {
            this.studyId = null;
            this.studyIdentifier = str;
        }
    }

    public String getStudyIdentifier() {
        return studyIdentifier;
    }

    public void setStudyIdentifier(String studyIdentifier) {
        this.studyIdentifier = studyIdentifier;
    }
}
