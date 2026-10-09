package com.enrollnow.identity.dtos;

import jakarta.validation.constraints.NotBlank;

public class GrantStudyAccessRequest {

    private String studyRole;

    @NotBlank
    private String studyPermission;

    public String getStudyRole() {
        return studyRole;
    }

    public void setStudyRole(String studyRole) {
        this.studyRole = studyRole;
    }

    public String getStudyPermission() {
        return studyPermission;
    }

    public void setStudyPermission(String studyPermission) {
        this.studyPermission = studyPermission;
    }
}