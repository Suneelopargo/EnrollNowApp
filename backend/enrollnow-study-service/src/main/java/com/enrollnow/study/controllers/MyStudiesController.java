package com.enrollnow.study.controllers;

import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.services.MyStudiesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users/{userId}/studies")
public class MyStudiesController {

    private final MyStudiesService myStudiesService;

    public MyStudiesController(MyStudiesService myStudiesService) {
        this.myStudiesService = myStudiesService;
    }

    @GetMapping
    public ResponseEntity<List<MyStudyResponse>> getMyStudies(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {

        return ResponseEntity.ok(
                myStudiesService.getMyStudies(tenantId, userId)
        );
    }
}
