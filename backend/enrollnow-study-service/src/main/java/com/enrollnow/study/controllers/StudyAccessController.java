package com.enrollnow.study.controllers;

import com.enrollnow.study.services.StudyAccessService;
import com.enrollnow.study.dtos.GrantStudyAccessRequest;
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
    
    @DeleteMapping("/{userId}/access")
    public ResponseEntity<Void> removeStudyAccess(
            @PathVariable UUID tenantId,
            @PathVariable UUID studyId,
            @PathVariable UUID userId) {

        studyAccessService.removeStudyAccess(
                tenantId,
                studyId,
                userId
        );

        return ResponseEntity.noContent().build();
    }
}
