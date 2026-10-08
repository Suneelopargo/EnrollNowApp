package com.enrollnow.access.controllers;

import com.enrollnow.access.services.StudyAccessService;
import com.enrollnow.identity.dtos.GrantStudyAccessRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/studies/{studyId}/users")
public class StudyAccessController {

    private final StudyAccessService studyAccessService;

    public StudyAccessController(StudyAccessService studyAccessService) {
        this.studyAccessService = studyAccessService;
    }

    @PostMapping("/{userId}/access")
    public ResponseEntity<Void> grantStudyAccess(
            @PathVariable UUID tenantId,
            @PathVariable UUID studyId,
            @PathVariable UUID userId,
            @Valid @RequestBody GrantStudyAccessRequest request
    ) {

        studyAccessService.grantStudyAccess(
                tenantId,
                studyId,
                userId,
                request
        );

        return ResponseEntity.noContent().build();
    }
}