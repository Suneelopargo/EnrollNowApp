package com.enrollnow.participant.dtos;

public class StudyAvailabilityResponse {

    private final boolean available;

    public StudyAvailabilityResponse(boolean available) {
        this.available = available;
    }

    public boolean isAvailable() {
        return available;
    }
}
