package com.enrollnow.participant.dtos;

import java.util.UUID;

public class ContactOutcomeDto {

    private UUID id;
    private String outcome;
    private boolean active;

    public ContactOutcomeDto() {
    }

    public ContactOutcomeDto(UUID id, String outcome, boolean active) {
        this.id = id;
        this.outcome = outcome;
        this.active = active;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
