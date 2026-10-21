package com.enrollnow.study.exceptions;

import java.util.UUID;

public class StudyNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public StudyNotFoundException(UUID studyId) {
        super("Study not found: " + studyId);
    }

    public StudyNotFoundException(String message) {
        super(message);
    }
}
