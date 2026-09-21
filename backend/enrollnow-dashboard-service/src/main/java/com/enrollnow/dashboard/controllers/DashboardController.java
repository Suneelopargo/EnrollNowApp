package com.enrollnow.dashboard.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.dashboard.dto.DashboardOverviewResponse;
import com.enrollnow.dashboard.services.DashboardAggregationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Executive Dashboard", description = "Endpoints for aggregated clinical trial KPIs, recruitment funnel, study overviews, and operational alerts")
@SecurityRequirement(name = "BearerAuth")
public class DashboardController {

    private final DashboardAggregationService dashboardService;

    public DashboardController(DashboardAggregationService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get Consolidated Executive Dashboard Overview",
            description = "Returns a single aggregated JSON payload containing KPI counters, study recruitment states, funnel pipeline, and active operational alerts.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Consolidated dashboard retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DashboardOverviewResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated")
    })
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getOverview() {
        DashboardOverviewResponse response = dashboardService.getOverview();
        return ResponseEntity.ok(ApiResponse.success("Dashboard overview retrieved successfully", response));
    }
}
