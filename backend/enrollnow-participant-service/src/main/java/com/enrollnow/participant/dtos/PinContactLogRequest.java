package com.enrollnow.participant.dtos;

public class PinContactLogRequest {

    private boolean sticky;

    public PinContactLogRequest() {
    }

    public PinContactLogRequest(boolean sticky) {
        this.sticky = sticky;
    }

    public boolean isSticky() {
        return sticky;
    }

    public void setSticky(boolean sticky) {
        this.sticky = sticky;
    }
}
