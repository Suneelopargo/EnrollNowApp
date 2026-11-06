package com.enrollnow.study.exceptions;

public class DuplicateStudyNameException extends RuntimeException {

    public DuplicateStudyNameException(String message) {
        super(message);
    }
}
