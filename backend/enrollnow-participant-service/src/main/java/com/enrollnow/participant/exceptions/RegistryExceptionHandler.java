package com.enrollnow.participant.exceptions;

import com.enrollnow.common.core.ApiError;
import com.enrollnow.common.core.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.enrollnow.participant")
public class RegistryExceptionHandler {
    @ExceptionHandler(RegistryParticipantNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> participantNotFound(RegistryParticipantNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(new ApiError("PARTICIPANT_NOT_FOUND", ex.getMessage())));
    }

    @ExceptionHandler(RegistrySavedSearchNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> savedSearchNotFound(RegistrySavedSearchNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(new ApiError("SAVED_SEARCH_NOT_FOUND", ex.getMessage())));
    }

    @ExceptionHandler(RegistryDuplicateException.class)
    public ResponseEntity<ApiResponse<Void>> duplicate(RegistryDuplicateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(new ApiError("DUPLICATE_RECORD", ex.getMessage())));
    }
}
