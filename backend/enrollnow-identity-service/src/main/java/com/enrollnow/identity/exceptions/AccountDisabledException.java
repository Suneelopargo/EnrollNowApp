package com.enrollnow.identity.exceptions;

public class AccountDisabledException extends RuntimeException {

    public AccountDisabledException() {
        super("User account is disabled");
    }
}