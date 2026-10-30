package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SendSmsRequest {
    private String toPhone;
    private List<String> toPhones = new ArrayList<>();

    @NotBlank(message = "SMS body cannot be empty")
    private String body;

    private boolean pinned = false;
    private UUID studyId;
    private String studyIdentifier;

    public SendSmsRequest() {}

    public String getToPhone() { return toPhone; }
    public void setToPhone(String toPhone) { this.toPhone = toPhone; }

    public List<String> getToPhones() { return toPhones; }
    public void setToPhones(List<String> toPhones) { this.toPhones = toPhones; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }

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
        if (str.isEmpty() || "registry".equalsIgnoreCase(str) || "null".equalsIgnoreCase(str) || "undefined".equalsIgnoreCase(str)) {
            this.studyId = null;
            this.studyIdentifier = null;
            return;
        }
        try {
            this.studyId = UUID.fromString(str);
            this.studyIdentifier = this.studyId.toString();
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
