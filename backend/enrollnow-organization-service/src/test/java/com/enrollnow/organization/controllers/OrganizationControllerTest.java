package com.enrollnow.organization.controllers;

import com.enrollnow.common.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class OrganizationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String token;

    @BeforeEach
    void setUp() {
        token = tokenProvider.generateToken(1L, "org_admin", List.of("ROLE_SUPER_ADMIN"), 1L);
    }

    @Test
    void testGetOrganizationsAuthorized() throws Exception {
        mockMvc.perform(get("/api/v1/organizations")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void testUnauthenticatedGetOrganizationsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/organizations"))
                .andExpect(status().isUnauthorized());
    }
}
