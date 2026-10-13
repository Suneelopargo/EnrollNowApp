package com.enrollnow.participant.exceptions;

public class RegistryDuplicateException extends RuntimeException {
    public RegistryDuplicateException(String message) {
        super(message);
    }
}
