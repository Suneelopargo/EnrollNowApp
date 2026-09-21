package com.enrollnow.common.core;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {

    private String code;
    private String message;
    private List<String> details;

    public ApiError() {
    }

    public ApiError(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public ApiError(String code, String message, List<String> details) {
        this.code = code;
        this.message = message;
        this.details = details;
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

    public List<String> getDetails() {
        return details;
    }

    public void setDetails(List<String> details) {
        this.details = details;
    }

    public void addDetail(String detail) {
        if (this.details == null) {
            this.details = new ArrayList<>();
        }
        this.details.add(detail);
    }
}
