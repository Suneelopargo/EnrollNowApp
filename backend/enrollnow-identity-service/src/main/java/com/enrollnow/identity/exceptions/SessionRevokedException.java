package com.enrollnow.identity.exceptions;

public class SessionRevokedException extends RuntimeException {

    private final String reason;

    public SessionRevokedException(String message, String reason) {
        super(message);
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }
}
