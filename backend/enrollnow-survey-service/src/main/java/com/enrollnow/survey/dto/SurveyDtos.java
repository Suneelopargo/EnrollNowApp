package com.enrollnow.survey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class SurveyDtos {

    public record QuestionOptionDto(
            Long id,
            String label,
            String value,
            int position
    ) {}

    public record QuestionDto(
            Long id,
            Long sectionId,
            int position,
            @NotBlank(message = "Question type is required")
            String type,
            @NotBlank(message = "Question text is required")
            String text,
            String description,
            boolean required,
            List<String> options
    ) {}

    public record SectionDto(
            Long id,
            @NotBlank(message = "Section title is required")
            String title,
            String description,
            int position
    ) {}

    public record LogicRuleDto(
            Long id,
            @NotNull(message = "If-Question ID is required")
            Long ifQuestionId,
            String condition,
            @NotBlank(message = "Rule trigger value is required")
            String value,
            String thenAction,
            Long thenQuestionId
    ) {}

    public record SurveyCreateRequest(
            @NotBlank(message = "Survey title is required")
            String title,
            String description,
            Long studyId,
            boolean anonymousResponses,
            boolean allowMultipleResponses,
            boolean showProgressBar,
            String thankYouMessage,
            List<SectionDto> sections,
            List<QuestionDto> questions,
            List<LogicRuleDto> logicRules
    ) {}

    public record SurveyUpdateRequest(
            @NotBlank(message = "Survey title is required")
            String title,
            String description,
            Long studyId,
            String status,
            boolean anonymousResponses,
            boolean allowMultipleResponses,
            boolean showProgressBar,
            String thankYouMessage,
            List<SectionDto> sections,
            List<QuestionDto> questions,
            List<LogicRuleDto> logicRules
    ) {}

    public record SurveyDto(
            Long id,
            String surveyCode,
            Long studyId,
            String title,
            String description,
            String status,
            boolean anonymousResponses,
            boolean allowMultipleResponses,
            boolean showProgressBar,
            String thankYouMessage,
            boolean globalSubmission,
            boolean triggerEmailNotification,
            boolean enableEconsentCountersign,
            boolean requireRecaptcha,
            String publicToken,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            List<SectionDto> sections,
            List<QuestionDto> questions,
            List<LogicRuleDto> logicRules,
            int versionCount,
            long totalResponses
    ) {}

    public record SurveyListItemDto(
            Long id,
            String surveyCode,
            Long studyId,
            String title,
            String description,
            String status,
            String publicToken,
            int questionsCount,
            int sectionsCount,
            long totalResponses,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record SurveyAssignmentDto(
            Long id,
            Long userId,
            Long surveyId,
            String surveyCode,
            String surveyTitle,
            String status,
            String publicToken,
            OffsetDateTime assignedAt
    ) {}

    public record CreateAssignmentRequest(
            @NotNull(message = "User ID is required")
            Long userId,
            @NotNull(message = "Survey ID is required")
            Long surveyId
    ) {}

    public record AnswerItemRequest(
            @NotNull(message = "Question ID is required")
            Long questionId,
            Object value
    ) {}

    public record SubmitResponseRequest(
            List<AnswerItemRequest> answers,
            Long participantId,
            Long studyId,
            String userEmail
    ) {}

    public record AnswerItemResponse(
            Long id,
            Long questionId,
            String questionText,
            Object value
    ) {}

    public record SurveyResponseDto(
            Long id,
            Long surveyId,
            String surveyTitle,
            Long userId,
            String userEmail,
            String status,
            String sessionToken,
            OffsetDateTime startedAt,
            OffsetDateTime completedAt,
            List<AnswerItemResponse> answers
    ) {}

    public record DailyResponseStat(
            String date,
            long count,
            List<String> respondents
    ) {}

    public record SurveyDashboardDto(
            long totalSurveys,
            long draftSurveys,
            long publishedSurveys,
            long totalResponses,
            double completionRate,
            List<SurveyListItemDto> recentSurveys,
            List<DailyResponseStat> responsesByDay
    ) {}

    public record SurveyAnalyticsDto(
            Long surveyId,
            String surveyTitle,
            long totalResponses,
            long completedResponses,
            double completionRate,
            Double averageRating,
            List<DailyResponseStat> responsesByDay
    ) {}

    public record AiGenerateRequest(
            @NotBlank(message = "Prompt is required")
            String prompt,
            String studyType,
            Integer targetQuestionsCount
    ) {}

    public record AiGenerateResponse(
            String title,
            String description,
            List<SectionDto> sections,
            List<QuestionDto> questions,
            List<LogicRuleDto> logicRules
    ) {}

    public record AiLogicSuggestionRequest(
            List<QuestionDto> questions
    ) {}

    public record AiLogicSuggestionResponse(
            List<LogicRuleDto> suggestions
    ) {}

    public record AiResponseAssessmentDto(
            Long responseId,
            String summary,
            String sentiment,
            List<String> clinicalFlags,
            List<String> recommendations
    ) {}
}
