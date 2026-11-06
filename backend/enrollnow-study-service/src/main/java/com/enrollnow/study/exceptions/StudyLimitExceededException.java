package com.enrollnow.study.exceptions;

public class StudyLimitExceededException extends RuntimeException {

    public StudyLimitExceededException(String message) {
        super(message);
    }
}
