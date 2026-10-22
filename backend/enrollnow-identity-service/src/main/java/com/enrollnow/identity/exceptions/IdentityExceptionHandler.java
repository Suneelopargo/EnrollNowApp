package com.enrollnow.identity.exceptions;

import com.enrollnow.common.core.ApiResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class IdentityExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "USER_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(HttpStatus.CONFLICT.value(), "EMAIL_ALREADY_EXISTS", ex.getMessage()));
    }

    @ExceptionHandler(RoleNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleRoleNotFound(RoleNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "ROLE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InvalidRoleAssignmentException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidRoleAssignment(InvalidRoleAssignmentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "INVALID_ROLE_ASSIGNMENT", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateRoleAssignmentException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicateRoleAssignment(DuplicateRoleAssignmentException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(HttpStatus.CONFLICT.value(), "DUPLICATE_ROLE_ASSIGNMENT", ex.getMessage()));
    }

    @ExceptionHandler(InvalidPermissionException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidPermission(InvalidPermissionException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "INVALID_PERMISSION", ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "INVALID_CREDENTIALS", ex.getMessage()));
    }

    @ExceptionHandler(AccountDisabledException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccountDisabled(AccountDisabledException ex) {
        String code = ex.getCode() != null ? ex.getCode() : "ACCOUNT_DISABLED";
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), code, ex.getMessage()));
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccountLocked(AccountLockedException ex) {
        String code = ex.getCode() != null ? ex.getCode() : "ACCOUNT_LOCKED";
        return ResponseEntity
                .status(HttpStatus.LOCKED)
                .body(ApiResponse.error(HttpStatus.LOCKED.value(), code, ex.getMessage(), ex.getReason()));
    }

    @ExceptionHandler(AlreadyEnrolledException.class)
    public ResponseEntity<ApiResponse<Void>> handleAlreadyEnrolled(AlreadyEnrolledException ex) {
        String code = ex.getErrorCode() != null ? ex.getErrorCode() : "ALREADY_ENROLLED";
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(HttpStatus.CONFLICT.value(), code, ex.getMessage()));
    }

    @ExceptionHandler(SessionRevokedException.class)
    public ResponseEntity<ApiResponse<Void>> handleSessionRevoked(SessionRevokedException ex) {
        String reason = ex.getReason() != null ? ex.getReason() : "REVOKED";
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "SESSION_REVOKED", ex.getMessage(), reason));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(HttpStatus.CONFLICT.value(), "DATA_CONFLICT",
                        "A conflicting role assignment or data constraint already exists for this record."));
    }
}
