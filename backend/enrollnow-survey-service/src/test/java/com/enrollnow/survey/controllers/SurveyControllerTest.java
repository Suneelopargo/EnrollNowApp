package com.enrollnow.survey.controllers;

import com.enrollnow.common.security.JwtTokenProvider;
import com.enrollnow.survey.dto.SurveyDtos.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class SurveyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String participantToken;

    @BeforeEach
    void setUp() {
        adminToken = tokenProvider.generateToken(1L, "survey_admin", List.of("ROLE_SUPER_ADMIN"), 1L);
        participantToken = tokenProvider.generateToken(2L, "participant_user", List.of("ROLE_PARTICIPANT"), 1L);
    }

    @Test
    void testCreatePublishAndTakeSurveyFlow() throws Exception {
        // 1. Create Survey Draft
        SurveyCreateRequest createRequest = new SurveyCreateRequest(
                "Clinical Trial Baseline Questionnaire",
                "Patient reported outcome measures",
                101L,
                false,
                true,
                true,
                "Thank you for submitting your baseline questionnaire!",
                List.of(
                        new SectionDto(null, "Health History", "Medical background", 0),
                        new SectionDto(null, "Symptoms", "Current symptoms", 1)
                ),
                List.of(
                        new QuestionDto(null, null, 0, "Single Choice", "Do you have allergies?", null, true, List.of("Yes", "No")),
                        new QuestionDto(null, null, 1, "Rating", "Rate overall energy (1-10):", null, true, List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10")),
                        new QuestionDto(null, null, 2, "Paragraph", "Describe allergy details:", null, false, List.of())
                ),
                List.of(
                        new LogicRuleDto(null, 0L, "is", "Yes", "SHOW_QUESTION", 2L)
                )
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/surveys")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Clinical Trial Baseline Questionnaire")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andExpect(jsonPath("$.data.questions", hasSize(3)))
                .andReturn();

        SurveyDto createdSurvey = objectMapper.readValue(
                objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data").toString(),
                SurveyDto.class
        );
        Long surveyId = createdSurvey.id();
        String publicToken = createdSurvey.publicToken();

        // 2. Publish Survey
        mockMvc.perform(post("/api/v1/surveys/" + surveyId + "/publish")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")));

        // 3. Public Respondent: Fetch Survey by Token
        mockMvc.perform(get("/api/v1/surveys/public/" + publicToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Clinical Trial Baseline Questionnaire")))
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")));

        // 4. Public Respondent: Submit Valid Response
        SubmitResponseRequest submitRequest = new SubmitResponseRequest(
                List.of(
                        new AnswerItemRequest(createdSurvey.questions().get(0).id(), "Yes"),
                        new AnswerItemRequest(createdSurvey.questions().get(1).id(), 8),
                        new AnswerItemRequest(createdSurvey.questions().get(2).id(), "Penicillin allergy")
                ),
                501L,
                101L,
                "participant@trial.org"
        );

        mockMvc.perform(post("/api/v1/surveys/public/" + publicToken + "/responses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.answers", hasSize(3)));

        // 5. Admin: Verify Response Listing & Analytics
        mockMvc.perform(get("/api/v1/surveys/" + surveyId + "/responses")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/api/v1/surveys/" + surveyId + "/analytics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalResponses", is(1)))
                .andExpect(jsonPath("$.data.completionRate", is(100.0)));

        // 6. Admin: Export CSV
        mockMvc.perform(get("/api/v1/surveys/" + surveyId + "/responses/export")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("survey-" + surveyId + "-responses.csv")))
                .andExpect(content().string(containsString("Clinical Trial Baseline Questionnaire")));
    }

    @Test
    void testAiSurveyGenerationAndSuggestions() throws Exception {
        AiGenerateRequest aiReq = new AiGenerateRequest("Generate a cardiovascular trial questionnaire", "Cardiology", 5);

        mockMvc.perform(post("/api/v1/surveys/ai/generate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(aiReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", containsString("Cardiovascular")))
                .andExpect(jsonPath("$.data.questions", hasSize(greaterThanOrEqualTo(3))));
    }

    @Test
    void testAssignmentLifecycle() throws Exception {
        // Create survey
        SurveyCreateRequest createRequest = new SurveyCreateRequest(
                "Study Assignment Form", "Assignment test", 101L, true, true, true, "Thank you",
                List.of(),
                List.of(new QuestionDto(null, null, 0, "Yes / No", "Are you ready?", null, true, List.of("Yes", "No"))),
                List.of()
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/surveys")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        SurveyDto survey = objectMapper.readValue(
                objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data").toString(),
                SurveyDto.class
        );

        // Assign survey to user 2
        CreateAssignmentRequest assignReq = new CreateAssignmentRequest(2L, survey.id());
        MvcResult assignResult = mockMvc.perform(post("/api/v1/surveys/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId", is(2)))
                .andReturn();

        SurveyAssignmentDto assignment = objectMapper.readValue(
                objectMapper.readTree(assignResult.getResponse().getContentAsString()).get("data").toString(),
                SurveyAssignmentDto.class
        );

        // User 2: Check assigned surveys
        mockMvc.perform(get("/api/v1/surveys/me/assigned")
                        .header("Authorization", "Bearer " + participantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // Admin: Unassign
        mockMvc.perform(delete("/api/v1/surveys/assignments/" + assignment.id())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}
