package com.enrollnow.auth;

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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthControllerTest {

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

    private static final String TEST_USER = "auth_test_user";
    private static final String TEST_EMAIL = "auth_test@enrollnow.local";
    private static final String TEST_PASS = "TestPassword2026!";

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByUsername(TEST_USER)) {
            User user = new User(TEST_USER, TEST_EMAIL, passwordEncoder.encode(TEST_PASS), "Test", "User");
            user.setActive(true);
            User saved = userRepository.save(user);

            roleRepository.findByRoleCode("ROLE_STUDY_USER").ifPresent(role -> {
                userRoleRepository.save(new UserRole(saved, role));
            });
        }
    }

    @Test
    void testValidLogin() throws Exception {
        LoginRequest request = new LoginRequest(TEST_USER, TEST_PASS);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.user.username", is(TEST_USER)))
                .andExpect(jsonPath("$.data.user.email", is(TEST_EMAIL)));
    }

    @Test
    void testInvalidPassword() throws Exception {
        LoginRequest request = new LoginRequest(TEST_USER, "WrongPassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testUnknownUser() throws Exception {
        LoginRequest request = new LoginRequest("non_existent_user_999", "SomePass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testInactiveUserLoginRejection() throws Exception {
        String inactiveUser = "inactive_test_user";
        User user = new User(inactiveUser, "inactive@enrollnow.local", passwordEncoder.encode("Pass123!"), "Inactive", "User");
        user.setActive(false);
        userRepository.save(user);

        LoginRequest request = new LoginRequest(inactiveUser, "Pass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testMalformedLoginRequest() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usernameOrEmail\":\"\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void testGetCurrentUserAuthenticated() throws Exception {
        // Step 1: Login
        LoginRequest request = new LoginRequest(TEST_USER, TEST_PASS);
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String responseJson = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseJson).get("data").get("accessToken").asText();

        // Step 2: Call /api/auth/me with Bearer token
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is(TEST_USER)))
                .andExpect(jsonPath("$.data.email", is(TEST_EMAIL)));
    }

    @Test
    void testGetCurrentUserUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetCurrentUserInvalidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token.here"))
                .andExpect(status().isUnauthorized());
    }
}
