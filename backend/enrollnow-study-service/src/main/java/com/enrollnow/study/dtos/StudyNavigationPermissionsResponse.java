package com.enrollnow.study.dtos;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StudyNavigationPermissionsResponse {

    private UUID studyId;
    private String studyCode;
    private String studyName;
    private String studyRole;
    private String studyPermission;
    private List<String> permissions = new ArrayList<>();
    private boolean archived;
    private String status;

    public StudyNavigationPermissionsResponse() {
    }

    public StudyNavigationPermissionsResponse(
            UUID studyId,
            String studyCode,
            String studyName,
            String studyRole,
            String studyPermission,
            List<String> permissions,
            boolean archived,
            String status
    ) {
        this.studyId = studyId;
        this.studyCode = studyCode;
        this.studyName = studyName;
        this.studyRole = studyRole;
        this.studyPermission = studyPermission;
        this.permissions = permissions != null ? permissions : new ArrayList<>();
        this.archived = archived;
        this.status = status;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public String getStudyCode() {
        return studyCode;
    }

    public void setStudyCode(String studyCode) {
        this.studyCode = studyCode;
    }

    public String getStudyName() {
        return studyName;
    }

    public void setStudyName(String studyName) {
        this.studyName = studyName;
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

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions != null ? permissions : new ArrayList<>();
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
