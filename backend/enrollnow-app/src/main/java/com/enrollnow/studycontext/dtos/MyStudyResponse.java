package com.enrollnow.studycontext.dtos;

import java.util.UUID;

public class MyStudyResponse {

    private UUID id;
    private String code;
    private String name;
    private String studyRole;
    private String studyPermission;

    public MyStudyResponse() {
    }

    public MyStudyResponse(
            UUID id,
            String code,
            String name,
            String studyRole,
            String studyPermission) {

        this.id = id;
        this.code = code;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
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