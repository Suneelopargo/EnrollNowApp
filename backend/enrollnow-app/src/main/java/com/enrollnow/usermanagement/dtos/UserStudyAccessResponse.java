package com.enrollnow.usermanagement.dtos;

import java.util.UUID;

public class UserStudyAccessResponse {

    private UUID id;
    private String name;
    private String studyRole;
    private String studyPermission;

    public UserStudyAccessResponse() {
    }

    public UserStudyAccessResponse(
            UUID id,
            String name,
            String studyRole,
            String studyPermission) {
        this.id = id;
        this.name = name;
        this.studyRole = studyRole;
        this.studyPermission = studyPermission;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

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