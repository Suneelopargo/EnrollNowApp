package com.enrollnow.identity.exceptions;

public class AccountLockedException extends RuntimeException {

    private final String code;
    private final String reason;

    public AccountLockedException() {
        this("ACCOUNT_LOCKED_DEFAULT", "Your account is locked. Please contact the EnrollNow administrator at your institution");
    }

    public AccountLockedException(String message) {
        this("ACCOUNT_LOCKED_DEFAULT", message);
    }

    public AccountLockedException(String code, String message) {
        this(code, message, null);
    }

    public AccountLockedException(String code, String message, String reason) {
        super(message != null ? message : "Your account is locked. Please contact the EnrollNow administrator at your institution");
        this.code = code != null ? code : "ACCOUNT_LOCKED_DEFAULT";
        this.reason = reason;
    }

    public String getCode() {
        return code;
    }

    public String getReason() {
        return reason;
    }
}
