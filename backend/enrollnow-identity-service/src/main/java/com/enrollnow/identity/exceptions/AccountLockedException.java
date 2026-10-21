package com.enrollnow.identity.exceptions;

public class AccountLockedException extends RuntimeException {

    public AccountLockedException() {
        super("User account is locked");
    }
}