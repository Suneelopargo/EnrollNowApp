package com.enrollnow.study.services;

import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyRequest;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Authoritative service managing clinical study lifecycles, queries, and summaries.
 */
@Service
public class StudyService {

    private final StudyRepository studyRepository;
    private final MyStudiesService myStudiesService;

    public StudyService(StudyRepository studyRepository) {
        this(studyRepository, null);
    }

    @Autowired
    public StudyService(StudyRepository studyRepository,
                        @Autowired(required = false) MyStudiesService myStudiesService) {
        this.studyRepository = studyRepository;
        this.myStudiesService = myStudiesService;
    }

    @Transactional(readOnly = true)
    public List<StudySummaryResponse> getStudies(UUID tenantId,
                                                boolean includeArchived,
                                                UUID callerUserId,
                                                boolean canManageSiteAdmins) {
        List<Study> studies;
        if (tenantId != null) {
            studies = includeArchived
                    ? studyRepository.findByTenantId(tenantId)
                    : studyRepository.findByTenantIdAndArchivedFalse(tenantId);
        } else {
            studies = includeArchived
                    ? studyRepository.findAll()
                    : studyRepository.findAll().stream().filter(s -> !s.isArchived()).collect(Collectors.toList());
        }

        // If caller is non-admin and restricted to assigned studies
        if (callerUserId != null && !canManageSiteAdmins && myStudiesService != null && tenantId != null) {
            List<MyStudyResponse> myStudies = myStudiesService.getMyStudies(tenantId, callerUserId);
            Set<UUID> assignedIds = myStudies.stream()
                    .map(MyStudyResponse::getId)
                    .collect(Collectors.toSet());
            studies = studies.stream()
                    .filter(s -> assignedIds.contains(s.getId()))
                    .collect(Collectors.toList());
        }

        return studies.stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudySummaryResponse getStudyByIdOrCode(UUID tenantId, String studyId) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        return toSummaryResponse(study);
    }

    @Transactional
    public StudySummaryResponse createStudy(UUID tenantId, CreateStudyRequest request) {
        UUID effectiveTenantId = tenantId != null
                ? tenantId
                : UUID.fromString("11111111-1111-1111-1111-111111111111");

        String name = (request != null && request.getName() != null && !request.getName().isBlank())
                ? request.getName().trim()
                : "New Study";

        String code = (request != null && request.getStudyCode() != null && !request.getStudyCode().isBlank())
                ? request.getStudyCode().trim()
                : "STD-" + System.currentTimeMillis();

        String description = (request != null && request.getDescription() != null)
                ? request.getDescription()
                : "";

        Integer sampleSize = (request != null && request.getSampleSize() != null)
                ? request.getSampleSize()
                : 100;

        Study study = new Study();
        study.setTenantId(effectiveTenantId);
        study.setName(name);
        study.setStudyCode(code);
        study.setDescription(description);
        study.setSampleSize(sampleSize);
        study.setArchived(false);
        study.setCreatedAt(OffsetDateTime.now());
        study.setUpdatedAt(OffsetDateTime.now());

        Study saved = studyRepository.save(study);
        return toSummaryResponse(saved);
    }

    @Transactional
    public StudySummaryResponse updateStudy(UUID tenantId, String studyId, UpdateStudyRequest request) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        if (request != null) {
            if (request.getName() != null && !request.getName().isBlank()) {
                study.setName(request.getName().trim());
            }
            if (request.getDescription() != null) {
                study.setDescription(request.getDescription());
            }
            if (request.getArchived() != null) {
                study.setArchived(request.getArchived());
            }
            if (request.getSampleSize() != null) {
                study.setSampleSize(request.getSampleSize());
            }
        }
        study.setUpdatedAt(OffsetDateTime.now());

        Study updated = studyRepository.save(study);
        return toSummaryResponse(updated);
    }

    public StudySummaryResponse toSummaryResponse(Study s) {
        StudySummaryResponse res = new StudySummaryResponse(
                s.getId(),
                s.getStudyCode(),
                s.getName(),
                s.getDescription(),
                s.isArchived()
        );
        int sample = s.getSampleSize() != null ? s.getSampleSize() : 100;
        res.setSampleSize(sample);
        int enrolled = Math.max(0, (int) Math.round(sample * 0.65));
        res.setEnrolled(enrolled);
        return res;
    }

    private Optional<Study> findStudyByIdOrCode(UUID tenantId, String studyId) {
        if (studyId == null || studyId.isBlank()) {
            return Optional.empty();
        }

        UUID idUuid = null;
        try {
            idUuid = UUID.fromString(studyId.trim());
        } catch (IllegalArgumentException ignored) {
        }

        if (idUuid != null) {
            if (tenantId != null) {
                Optional<Study> byId = studyRepository.findByTenantIdAndId(tenantId, idUuid);
                if (byId.isPresent()) {
                    return byId;
                }
            } else {
                Optional<Study> byId = studyRepository.findById(idUuid);
                if (byId.isPresent()) {
                    return byId;
                }
            }
        }

        if (tenantId != null) {
            return studyRepository.findByTenantIdAndStudyCode(tenantId, studyId.trim());
        }
        return Optional.empty();
    }
}
