package com.enrollnow.participant.exceptions;

public class RegistryParticipantNotFoundException extends RuntimeException {
    public RegistryParticipantNotFoundException(Object id) {
        super("Registry participant not found: " + id);
    }
}
