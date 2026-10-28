package com.enrollnow.study.controllers;

import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.services.MyStudiesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users/{userId}/studies")
public class MyStudiesController {

    private final MyStudiesService myStudiesService;
    private final SiteAuthorizationService siteAuthorizationService;

    @Autowired
    public MyStudiesController(
            MyStudiesService myStudiesService,
            SiteAuthorizationService siteAuthorizationService
    ) {
        this.myStudiesService = Objects.requireNonNull(myStudiesService, "myStudiesService must not be null");
        this.siteAuthorizationService = Objects.requireNonNull(siteAuthorizationService, "siteAuthorizationService must not be null");
    }

    @GetMapping
    public ResponseEntity<List<MyStudyResponse>> getMyStudies(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {
        siteAuthorizationService.requireSelfOrUserViewAccess(tenantId, userId, null);

        return ResponseEntity.ok(
                myStudiesService.getMyStudies(tenantId, userId)
        );
    }
}
