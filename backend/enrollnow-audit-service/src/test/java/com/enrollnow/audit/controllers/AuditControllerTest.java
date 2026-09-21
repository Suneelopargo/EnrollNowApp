package com.enrollnow.audit.controllers;

import com.enrollnow.audit.models.AdminAuditLog;
import com.enrollnow.audit.repositories.AdminAuditLogRepository;
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
public class AuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminAuditLogRepository auditRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String token;

    @BeforeEach
    void setUp() {
        token = tokenProvider.generateToken(1L, "audit_admin", List.of("ROLE_SUPER_ADMIN"), 1L);
        auditRepository.save(new AdminAuditLog("TEST_ACTION", 1L, "audit_admin", null, "target_user", "Test event", "127.0.0.1"));
    }

    @Test
    void testGetAuditLogsAuthorized() throws Exception {
        mockMvc.perform(get("/api/v1/audit/logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content[0].action", is("TEST_ACTION")));
    }
}
