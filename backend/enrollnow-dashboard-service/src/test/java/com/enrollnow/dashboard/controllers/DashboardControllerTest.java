package com.enrollnow.dashboard.controllers;

import com.enrollnow.common.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String token;

    @BeforeEach
    void setUp() {
        token = tokenProvider.generateToken(1L, "exec_user", List.of("ROLE_SUPER_ADMIN", "ROLE_STUDY_USER"), 1L);
    }

    @Test
    void testGetDashboardOverviewAuthorized() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/overview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.summary.activeStudiesCount", is(14)))
                .andExpect(jsonPath("$.data.studyOverview", notNullValue()))
                .andExpect(jsonPath("$.data.recruitmentPipeline", notNullValue()))
                .andExpect(jsonPath("$.data.recentActivity", notNullValue()))
                .andExpect(jsonPath("$.data.alerts", notNullValue()));
    }

    @Test
    void testGetDashboardOverviewUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/overview"))
                .andExpect(status().isUnauthorized());
    }
}
