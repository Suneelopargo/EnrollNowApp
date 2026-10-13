package com.enrollnow.participant.exceptions;

public class RegistrySavedSearchNotFoundException extends RuntimeException {
    public RegistrySavedSearchNotFoundException(Object id) {
        super("Saved Registry search not found: " + id);
    }
}
