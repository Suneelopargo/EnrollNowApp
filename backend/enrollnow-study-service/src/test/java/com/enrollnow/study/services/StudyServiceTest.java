package com.enrollnow.study.services;

import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyRequest;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyServiceTest {

    @Mock
    private StudyRepository studyRepository;

    @Mock
    private MyStudiesService myStudiesService;

    @Mock
    private StudyMemberRepository studyMemberRepository;

    @Mock
    private UserRepository userRepository;

    private StudyService studyService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID studyId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        studyService = new StudyService(studyRepository, myStudiesService);
        studyService.setStudyMemberRepository(studyMemberRepository);
        studyService.setUserRepository(userRepository);
    }

    @Test
    void getStudies_filtersByAssignedForNonAdmin() {
        Study study1 = new Study();
        study1.setId(studyId);
        study1.setName("Study One");
        study1.setStudyCode("S1");
        study1.setArchived(false);

        UUID otherId = UUID.randomUUID();
        Study study2 = new Study();
        study2.setId(otherId);
        study2.setName("Study Two");
        study2.setStudyCode("S2");
        study2.setArchived(false);

        when(studyRepository.findByTenantIdAndArchivedFalse(tenantId)).thenReturn(List.of(study1, study2));

        MyStudyResponse assigned = new MyStudyResponse(studyId, "S1", "Study One", "Coordinator", "STUDY_MEMBER");
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of(assigned));

        List<StudySummaryResponse> result = studyService.getStudies(tenantId, false, userId, false);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("S1", result.get(0).getStudyCode());
        assertEquals("Study One", result.get(0).getName());
    }

    @Test
    void getStudyByIdOrCode_found_returnsSummary() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Oncology Trial");
        study.setStudyCode("ONC-100");
        study.setSampleSize(200);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));

        StudySummaryResponse res = studyService.getStudyByIdOrCode(tenantId, studyId.toString());

        assertNotNull(res);
        assertEquals("ONC-100", res.getStudyCode());
        assertEquals("Oncology Trial", res.getName());
        assertEquals(200, res.getSampleSize());
        assertNull(res.getEnrolled()); // Synthetic 65% enrollment removed - non-fabricated representation
    }

    @Test
    void getStudyByIdOrCode_notFound_throwsStudyNotFoundException() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());

        assertThrows(
                StudyNotFoundException.class,
                () -> studyService.getStudyByIdOrCode(tenantId, studyId.toString())
        );
        verify(studyRepository, never()).findById(any());
    }

    @Test
    void updateStudy_crossTenantStudyId_throwsStudyNotFoundAndDoesNotFallbackToGlobalFindById() {
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.empty());
        when(studyRepository.findByTenantIdAndStudyCode(tenantId, studyId.toString())).thenReturn(Optional.empty());

        UpdateStudyRequest req = new UpdateStudyRequest("Hijacked Name", "Hijacked", true, 999);

        assertThrows(
                StudyNotFoundException.class,
                () -> studyService.updateStudy(tenantId, studyId.toString(), req)
        );
        verify(studyRepository, never()).findById(any());
        verify(studyRepository, never()).save(any());
    }

    @Test
    void createStudy_savesAndReturnsSummary() {
        CreateStudyRequest req = new CreateStudyRequest("Vaccine Trial", "VAC-01", "Phase 3 vaccine trial", 500);

        Study saved = new Study();
        saved.setId(studyId);
        saved.setTenantId(tenantId);
        saved.setName(req.getName());
        saved.setStudyCode(req.getStudyCode());
        saved.setDescription(req.getDescription());
        saved.setSampleSize(req.getSampleSize());

        when(studyRepository.save(any(Study.class))).thenReturn(saved);

        StudySummaryResponse res = studyService.createStudy(tenantId, req);

        assertNotNull(res);
        assertEquals("VAC-01", res.getStudyCode());
        assertEquals("Vaccine Trial", res.getName());
        assertEquals(500, res.getSampleSize());
        verify(studyRepository).save(any(Study.class));
    }

    @Test
    void updateStudy_updatesAndReturnsSummary() {
        Study existing = new Study();
        existing.setId(studyId);
        existing.setName("Old Name");
        existing.setStudyCode("STD-01");
        existing.setArchived(false);

        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(existing));
        when(studyRepository.save(any(Study.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateStudyRequest req = new UpdateStudyRequest("Updated Name", "Updated Description", true, 300);

        StudySummaryResponse res = studyService.updateStudy(tenantId, studyId.toString(), req);

        assertNotNull(res);
        assertEquals("Updated Name", res.getName());
        assertTrue(res.isArchived());
        assertEquals(300, res.getSampleSize());
    }

    @Test
    void getStudyByIdOrCode_nonAdmin_unassigned_throwsAccessDeniedException() {
        Study study = new Study();
        study.setId(studyId);
        study.setName("Restricted Study");
        when(studyRepository.findByTenantIdAndId(tenantId, studyId)).thenReturn(Optional.of(study));
        when(myStudiesService.getMyStudies(tenantId, userId)).thenReturn(List.of());

        assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> studyService.getStudyByIdOrCode(tenantId, studyId.toString(), userId, false)
        );
    }

    @Test
    void toSummaryResponseList_batchQueries_preventsNPlusOne() {
        Study study1 = new Study();
        study1.setId(studyId);
        study1.setName("Study 1");

        UUID otherId = UUID.randomUUID();
        Study study2 = new Study();
        study2.setId(otherId);
        study2.setName("Study 2");

        when(studyMemberRepository.findByIdStudyIdIn(anyCollection())).thenReturn(List.of());

        List<StudySummaryResponse> summaries = studyService.toSummaryResponseList(List.of(study1, study2));

        assertEquals(2, summaries.size());
        verify(studyMemberRepository, times(1)).findByIdStudyIdIn(anyCollection());
        verify(studyMemberRepository, never()).findByTenantIdAndIdStudyId(any(), any());
    }
}
