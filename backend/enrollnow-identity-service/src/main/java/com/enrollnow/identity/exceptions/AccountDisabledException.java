package com.enrollnow.identity.exceptions;

public class AccountDisabledException extends RuntimeException {

    public static final String DEFAULT_DISABLED_MESSAGE =
            "Your account has been temporarily disabled. Please contact the EnrollNow administrator at your institution to enable it. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.";

    public AccountDisabledException() {
        super(DEFAULT_DISABLED_MESSAGE);
    }

    public AccountDisabledException(String message) {
        super(message != null ? message : DEFAULT_DISABLED_MESSAGE);
    }
}
