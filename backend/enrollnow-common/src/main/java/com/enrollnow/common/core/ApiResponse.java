package com.enrollnow.common.core;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.slf4j.MDC;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private Integer status;
    private String code;
    private String message;
    private String reason;
    private T data;
    private ApiError error;
    private String correlationId;
    private String timestamp;

    public ApiResponse() {
        this.timestamp = Instant.now().toString();
        this.correlationId = MDC.get("correlationId");
    }

    public ApiResponse(boolean success, String message, T data, ApiError error) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
        if (error != null) {
            this.code = error.getCode();
        }
        this.timestamp = Instant.now().toString();
        this.correlationId = MDC.get("correlationId");
    }

    public ApiResponse(boolean success, Integer status, String code, String message, String reason, T data, ApiError error) {
        this.success = success;
        this.status = status;
        this.code = code != null ? code : (error != null ? error.getCode() : null);
        this.message = message;
        this.reason = reason;
        this.data = data;
        this.error = error;
        this.timestamp = Instant.now().toString();
        this.correlationId = MDC.get("correlationId");
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Operation successful", data, null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, message, null, new ApiError(code, message));
    }

    public static <T> ApiResponse<T> error(ApiError error) {
        return new ApiResponse<>(false, error.getMessage(), null, error);
    }

    public static <T> ApiResponse<T> error(int status, String code, String message) {
        return new ApiResponse<>(false, status, code, message, null, null, new ApiError(code, message));
    }

    public static <T> ApiResponse<T> error(int status, String code, String message, String reason) {
        return new ApiResponse<>(false, status, code, message, reason, null, new ApiError(code, message));
    }

    public static <T> ApiResponse<T> error(int status, ApiError error) {
        return new ApiResponse<>(false, status, error.getCode(), error.getMessage(), null, null, error);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public ApiError getError() {
        return error;
    }

    public void setError(ApiError error) {
        this.error = error;
        if (error != null && this.code == null) {
            this.code = error.getCode();
        }
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
