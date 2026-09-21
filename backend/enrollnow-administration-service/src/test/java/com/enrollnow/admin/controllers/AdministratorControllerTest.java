package com.enrollnow.admin.controllers;

import com.enrollnow.admin.dto.CreateRoleRequest;
import com.enrollnow.common.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AdministratorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void setUp() {
        adminToken = tokenProvider.generateToken(1L, "super_admin", List.of("ROLE_SUPER_ADMIN"), 1L);
    }

    @Test
    void testGetDashboardAuthorized() throws Exception {
        mockMvc.perform(get("/api/v1/administrator/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalRoles", notNullValue()));
    }

    @Test
    void testGetRolesAuthorized() throws Exception {
        mockMvc.perform(get("/api/v1/administrator/roles")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void testCreateRole() throws Exception {
        CreateRoleRequest request = new CreateRoleRequest();
        request.setName("Clinical Data Auditor");
        request.setRoleCode("ROLE_DATA_AUDITOR");
        request.setDescription("Role for auditing clinical trial data");
        request.setStatus("ACTIVE");

        mockMvc.perform(post("/api/v1/administrator/roles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.roleCode", is("ROLE_DATA_AUDITOR")));
    }

    @Test
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/v1/administrator/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testNonAdminUserForbidden() throws Exception {
        String nonAdminToken = tokenProvider.generateToken(2L, "coordinator", List.of("ROLE_COORDINATOR"), 1L);
        mockMvc.perform(get("/api/v1/administrator/dashboard")
                        .header("Authorization", "Bearer " + nonAdminToken))
                .andExpect(status().isForbidden());
    }
}
