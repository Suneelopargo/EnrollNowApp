package com.enrollnow.usermanagement.dtos;

import java.util.List;
import java.util.UUID;

import com.enrollnow.identity.dtos.UpdateUserRequest;

public class UpdateUserAccessRequest {

    private UpdateUserRequest user;
    private SiteAccessRequest siteAccess;
    private List<StudyAccessItemRequest> studies;

    public UpdateUserRequest getUser() {
        return user;
    }

    public void setUser(UpdateUserRequest user) {
        this.user = user;
    }

    public SiteAccessRequest getSiteAccess() {
        return siteAccess;
    }

    public void setSiteAccess(SiteAccessRequest siteAccess) {
        this.siteAccess = siteAccess;
    }

    public List<StudyAccessItemRequest> getStudies() {
        return studies;
    }

    public void setStudies(List<StudyAccessItemRequest> studies) {
        this.studies = studies;
    }

    public static class SiteAccessRequest {

        private UUID siteId;
        private String sitePermission;

        public UUID getSiteId() {
            return siteId;
        }

        public void setSiteId(UUID siteId) {
            this.siteId = siteId;
        }

        public String getSitePermission() {
            return sitePermission;
        }

        public void setSitePermission(String sitePermission) {
            this.sitePermission = sitePermission;
        }
    }

    public static class StudyAccessItemRequest {

        private UUID studyId;
        private String studyRole;
        private String studyPermission;

        public UUID getStudyId() {
            return studyId;
        }

        public void setStudyId(UUID studyId) {
            this.studyId = studyId;
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
}