package com.enrollnow.dashboard.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.dashboard.dto.DashboardOverviewResponse;
import com.enrollnow.dashboard.services.DashboardAggregationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    @Mock
    private DashboardAggregationService dashboardService;

    @InjectMocks
    private DashboardController dashboardController;

    @Test
    @DisplayName("GET /api/v1/dashboard/overview returns 200 with consolidated overview")
    void shouldReturnDashboardOverviewSuccessfully() {
        DashboardOverviewResponse mockResponse = new DashboardOverviewResponse();
        mockResponse.setActiveStudies(3);
        mockResponse.setTotalStudies(5);
        mockResponse.setTotalParticipants(350);
        mockResponse.setEnrolledParticipants(210);
        mockResponse.setRecentStudies(List.of());

        when(dashboardService.getOverview()).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<DashboardOverviewResponse>> response = dashboardController.getOverview();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(3, response.getBody().getData().getActiveStudies());
        assertEquals(5, response.getBody().getData().getTotalStudies());
        assertEquals(350, response.getBody().getData().getTotalParticipants());
        assertEquals(210, response.getBody().getData().getEnrolledParticipants());
    }
}
