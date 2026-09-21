package com.enrollnow.administrator;

import com.enrollnow.administrator.dto.CreateRoleRequest;
import com.enrollnow.administrator.dto.CreateUserRequest;
import com.enrollnow.auth.dto.LoginRequest;
import com.enrollnow.models.Role;
import com.enrollnow.models.User;
import com.enrollnow.models.UserRole;
import com.enrollnow.repository.RoleRepository;
import com.enrollnow.repository.UserRepository;
import com.enrollnow.repository.UserRoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AdministratorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private String adminToken;
    private String nonAdminToken;

    @BeforeEach
    void setUp() throws Exception {
        // Create Admin User if not existing
        String adminUser = "admin_test";
        String adminPass = "AdminPass2026!";
        if (!userRepository.existsByUsername(adminUser)) {
            User user = new User(adminUser, "admin_test@enrollnow.local", passwordEncoder.encode(adminPass), "Admin", "Test");
            user.setActive(true);
            Role superAdminRole = roleRepository.findByRoleCode("ROLE_SUPER_ADMIN").orElseThrow();
            User saved = userRepository.save(user);
            UserRole ur = new UserRole(saved, superAdminRole);
            saved.addUserRole(ur);
            userRoleRepository.save(ur);
            userRepository.save(saved);
        }

        // Create Non-Admin User if not existing
        String regularUser = "regular_user_test";
        String regularPass = "RegularPass2026!";
        if (!userRepository.existsByUsername(regularUser)) {
            User user = new User(regularUser, "regular@enrollnow.local", passwordEncoder.encode(regularPass), "Regular", "User");
            user.setActive(true);
            Role studyRole = roleRepository.findByRoleCode("ROLE_STUDY_USER").orElseThrow();
            User saved = userRepository.save(user);
            UserRole ur = new UserRole(saved, studyRole);
            saved.addUserRole(ur);
            userRoleRepository.save(ur);
            userRepository.save(saved);
        }

        entityManager.flush();
        entityManager.clear();

        // Obtain Admin Token
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(adminUser, adminPass))))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString()).get("data").get("accessToken").asText();

        // Obtain Non-Admin Token
        MvcResult regularResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(regularUser, regularPass))))
                .andExpect(status().isOk())
                .andReturn();
        nonAdminToken = objectMapper.readTree(regularResult.getResponse().getContentAsString()).get("data").get("accessToken").asText();
    }

    @Test
    void testAuthorizedAdminCanAccessDashboard() throws Exception {
        mockMvc.perform(get("/api/administrator/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalUsers", greaterThanOrEqualTo(1)));
    }

    @Test
    void testUnauthorizedUserRejectedFromAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/administrator/dashboard")
                        .header("Authorization", "Bearer " + nonAdminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAnonymousUserRejectedFromAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/administrator/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAdminGetUsers() throws Exception {
        mockMvc.perform(get("/api/administrator/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", not(empty())));
    }

    @Test
    void testAdminCreateUserAndDeactivate() throws Exception {
        CreateUserRequest createReq = new CreateUserRequest();
        createReq.setUsername("new_clinical_nurse");
        createReq.setEmail("nurse@enrollnow.local");
        createReq.setPassword("NursePass2026!");
        createReq.setFirstName("Sarah");
        createReq.setLastName("Jenkins");
        createReq.setRoles(List.of("ROLE_STUDY_USER"));

        MvcResult createResult = mockMvc.perform(post("/api/administrator/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username", is("new_clinical_nurse")))
                .andReturn();

        long createdUserId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Deactivate User
        mockMvc.perform(post("/api/administrator/users/" + createdUserId + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify deactivated status
        mockMvc.perform(get("/api/administrator/users/" + createdUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active", is(false)));
    }

    @Test
    void testAdminRoleAndPermissionMatrixWorkflow() throws Exception {
        // 1. Get Roles
        mockMvc.perform(get("/api/administrator/roles")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", not(empty())));

        // 2. Create Custom Role
        CreateRoleRequest roleReq = new CreateRoleRequest();
        roleReq.setRoleName("Quality Assurance Auditor");
        roleReq.setRoleCode("ROLE_QA_AUDITOR");
        roleReq.setDescription("Monitors clinical trial data integrity");

        MvcResult roleResult = mockMvc.perform(post("/api/administrator/roles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roleCode", is("ROLE_QA_AUDITOR")))
                .andReturn();

        long roleId = objectMapper.readTree(roleResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 3. Get Role Permissions
        mockMvc.perform(get("/api/administrator/roles/" + roleId + "/permissions")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", not(empty())));
    }

    @Test
    void testAdminAuditLogsQuery() throws Exception {
        mockMvc.perform(get("/api/administrator/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", notNullValue()));
    }
}
