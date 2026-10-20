package com.enrollnow.dashboard.services;

import com.enrollnow.dashboard.dto.DashboardOverviewResponse;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardAggregationServiceTest {

    @Mock
    private StudyRepository studyRepository;

    @Test
    @DisplayName("getOverview aggregates from database studies when present")
    void shouldAggregateFromDatabaseStudies() {
        Study s1 = new Study();
        UUID s1Id = UUID.randomUUID();
        s1.setId(s1Id);
        s1.setStudyCode("STUDY-001");
        s1.setName("Trial One");
        s1.setSampleSize(200);
        s1.setArchived(false);

        when(studyRepository.findAll()).thenReturn(List.of(s1));

        DashboardAggregationService service = new DashboardAggregationService(Optional.of(studyRepository));
        DashboardOverviewResponse overview = service.getOverview();

        assertNotNull(overview);
        assertEquals(1, overview.getTotalStudies());
        assertEquals(1, overview.getActiveStudies());
        assertEquals(1, overview.getRecentStudies().size());
        assertEquals("STUDY-001", overview.getRecentStudies().get(0).getStudyCode());
        assertEquals("Trial One", overview.getRecentStudies().get(0).getTitle());
        assertNotNull(overview.getSummary());
        assertNotNull(overview.getRecruitmentPipeline());
        assertNotNull(overview.getRecentActivity());
        assertNotNull(overview.getAlerts());
    }

    @Test
    @DisplayName("getOverview falls back to sample studies when database is empty")
    void shouldFallbackToSampleStudiesWhenEmpty() {
        DashboardAggregationService service = new DashboardAggregationService(Optional.empty());
        DashboardOverviewResponse overview = service.getOverview();

        assertNotNull(overview);
        assertTrue(overview.getTotalStudies() > 0);
        assertFalse(overview.getRecentStudies().isEmpty());
    }
}
