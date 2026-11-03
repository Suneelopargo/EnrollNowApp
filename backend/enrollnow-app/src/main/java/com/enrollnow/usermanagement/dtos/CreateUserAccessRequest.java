package com.enrollnow.usermanagement.dtos;

import com.enrollnow.identity.dtos.CreateUserRequest;
import jakarta.validation.Valid;

import java.util.List;

public class CreateUserAccessRequest {

    @Valid
    private CreateUserRequest user;

    @Valid
    private UpdateUserAccessRequest.SiteAccessRequest siteAccess;

    @Valid
    private List<UpdateUserAccessRequest.StudyAccessItemRequest> studies;

    public CreateUserRequest getUser() {
        return user;
    }

    public void setUser(CreateUserRequest user) {
        this.user = user;
    }

    public UpdateUserAccessRequest.SiteAccessRequest getSiteAccess() {
        return siteAccess;
    }

    public void setSiteAccess(UpdateUserAccessRequest.SiteAccessRequest siteAccess) {
        this.siteAccess = siteAccess;
    }

    public List<UpdateUserAccessRequest.StudyAccessItemRequest> getStudies() {
        return studies;
    }

    public void setStudies(
            List<UpdateUserAccessRequest.StudyAccessItemRequest> studies
    ) {
        this.studies = studies;
    }
}