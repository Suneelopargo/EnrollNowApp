package com.enrollnow.identity.exceptions;

public class AccountDisabledException extends RuntimeException {

    private final String code;

    public static final String DEFAULT_DISABLED_MESSAGE =
            "Your account has been temporarily disabled. Please contact the EnrollNow administrator at your institution to enable it. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.";

    public static final String PERMANENT_DISABLED_MESSAGE =
            "Your account has been permanently disabled. Please contact the EnrollNow administrator at your institution.";

    public AccountDisabledException() {
        this("ACCOUNT_DISABLED_TEMPORARY", DEFAULT_DISABLED_MESSAGE);
    }

    public AccountDisabledException(String message) {
        this("ACCOUNT_DISABLED_TEMPORARY", message);
    }

    public AccountDisabledException(String code, String message) {
        super(message != null ? message : DEFAULT_DISABLED_MESSAGE);
        this.code = code != null ? code : "ACCOUNT_DISABLED_TEMPORARY";
    }

    public String getCode() {
        return code;
    }
}
