package com.enrollnow.identity.exceptions;

public class AlreadyEnrolledException extends IllegalArgumentException {

    private final String errorCode;

    public AlreadyEnrolledException() {
        super("Already enrolled! Please login");
        this.errorCode = "ALREADY_ENROLLED";
    }

    public AlreadyEnrolledException(String message) {
        super(message);
        this.errorCode = "ALREADY_ENROLLED";
    }

    public AlreadyEnrolledException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode != null ? errorCode : "ALREADY_ENROLLED";
    }
}
