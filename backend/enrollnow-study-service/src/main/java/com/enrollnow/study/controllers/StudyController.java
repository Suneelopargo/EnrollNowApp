package com.enrollnow.study.controllers;

import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/studies")
public class StudyController {

    private final StudyRepository studyRepository;

    public StudyController(StudyRepository studyRepository) {
        this.studyRepository = studyRepository;
    }

    @GetMapping
    public ResponseEntity<List<StudySummaryResponse>> getStudies(
            @PathVariable UUID tenantId,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived
    ) {
        List<Study> studies = includeArchived
                ? studyRepository.findByTenantId(tenantId)
                : studyRepository.findByTenantIdAndArchivedFalse(tenantId);

        List<StudySummaryResponse> response = studies.stream()
                .map(s -> new StudySummaryResponse(
                        s.getId(),
                        s.getStudyCode(),
                        s.getName(),
                        s.getDescription(),
                        s.isArchived()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
