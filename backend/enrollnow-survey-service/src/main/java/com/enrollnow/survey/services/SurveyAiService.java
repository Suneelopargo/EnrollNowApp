package com.enrollnow.survey.services;

import com.enrollnow.survey.dto.SurveyDtos.*;
import com.enrollnow.survey.exceptions.SurveyExceptions.ResourceNotFoundException;
import com.enrollnow.survey.models.Question;
import com.enrollnow.survey.models.SurveyResponse;
import com.enrollnow.survey.models.SurveyResponseAnswer;
import com.enrollnow.survey.repositories.SurveyResponseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SurveyAiService {

    private static final Logger log = LoggerFactory.getLogger(SurveyAiService.class);

    private final SurveyResponseRepository responseRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.model:gpt-4o-mini}")
    private String openAiModel;

    public SurveyAiService(SurveyResponseRepository responseRepository, ObjectMapper objectMapper) {
        this.responseRepository = responseRepository;
        this.objectMapper = objectMapper;
    }

    public AiGenerateResponse generateSurvey(AiGenerateRequest request) {
        String prompt = request.prompt().toLowerCase();
        log.info("Generating survey with prompt: '{}'", prompt);

        String title = "Clinical Questionnaire";
        String description = "Automated clinical research instrument designed for protocol data collection.";
        List<SectionDto> sections = new ArrayList<>();
        List<QuestionDto> questions = new ArrayList<>();
        List<LogicRuleDto> logicRules = new ArrayList<>();

        if (prompt.contains("cardio") || prompt.contains("heart") || prompt.contains("blood pressure")) {
            title = "Cardiovascular Health & Symptom Questionnaire";
            description = "Patient-reported cardiovascular assessment evaluating vitals, symptoms, and lifestyle.";
            sections.add(new SectionDto(null, "Vital Signs & History", "Basic cardiovascular background", 0));
            sections.add(new SectionDto(null, "Symptom Log", "Recent symptoms and acute episodes", 1));

            questions.add(new QuestionDto(1L, 0L, 0, "Single Choice", "Have you been diagnosed with hypertension?", null, true, List.of("Yes", "No", "Unsure")));
            questions.add(new QuestionDto(2L, 0L, 1, "Rating", "Rate your typical physical stamina on a scale of 1 to 10:", null, true, List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10")));
            questions.add(new QuestionDto(3L, 1L, 2, "Yes / No", "Have you experienced chest tightness or palpitations in the last 7 days?", null, true, List.of("Yes", "No")));
            questions.add(new QuestionDto(4L, 1L, 3, "Paragraph", "Please describe the circumstances when chest tightness occurred:", null, false, List.of()));
            questions.add(new QuestionDto(5L, 1L, 4, "Date", "Date of most recent cardiology clinic visit:", null, false, List.of()));

            logicRules.add(new LogicRuleDto(null, 3L, "is", "Yes", "SHOW_QUESTION", 4L));
        } else if (prompt.contains("sleep") || prompt.contains("insomnia") || prompt.contains("psqi")) {
            title = "Sleep Quality & Restfulness Log (PSQI Adapted)";
            description = "Assessment of sleep habits, latency, and nighttime disruptions over the past month.";
            sections.add(new SectionDto(null, "Sleep Schedule", "Bedtime and wake time details", 0));
            sections.add(new SectionDto(null, "Disturbances", "Environmental and health factors affecting sleep", 1));

            questions.add(new QuestionDto(1L, 0L, 0, "Number", "Average number of hours of sleep per night:", null, true, List.of()));
            questions.add(new QuestionDto(2L, 0L, 1, "Dropdown", "How long does it typically take you to fall asleep?", null, true, List.of("< 15 minutes", "15-30 minutes", "30-60 minutes", "> 60 minutes")));
            questions.add(new QuestionDto(3L, 1L, 2, "Multiple Choice", "What factors disturbed your sleep this week?", null, false, List.of("Pain", "Cough/Snoring", "Feeling too hot/cold", "Bad dreams", "None")));
            questions.add(new QuestionDto(4L, 1L, 3, "Rating", "Rate overall sleep quality for the past 7 days:", null, true, List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10")));
        } else if (prompt.contains("adverse") || prompt.contains("safety") || prompt.contains("diary")) {
            title = "Patient Safety & Adverse Event Log";
            description = "Protocol safety monitoring questionnaire for tracking emerging clinical symptoms.";
            sections.add(new SectionDto(null, "General Tolerability", "Overall feeling and medication adherence", 0));
            sections.add(new SectionDto(null, "Adverse Events", "Detailed symptom occurrence and severity", 1));

            questions.add(new QuestionDto(1L, 0L, 0, "Yes / No", "Did you take your prescribed investigational dose today?", null, true, List.of("Yes", "No")));
            questions.add(new QuestionDto(2L, 1L, 1, "Yes / No", "Did you experience any adverse reactions or new symptoms?", null, true, List.of("Yes", "No")));
            questions.add(new QuestionDto(3L, 1L, 2, "Dropdown", "Indicate the severity of the adverse reaction:", null, true, List.of("Mild - easily tolerated", "Moderate - interferes with daily activity", "Severe - incapacitating")));
            questions.add(new QuestionDto(4L, 1L, 3, "Paragraph", "Please list any concomitant medications taken to manage symptoms:", null, false, List.of()));

            logicRules.add(new LogicRuleDto(null, 2L, "is", "Yes", "SHOW_QUESTION", 3L));
            logicRules.add(new LogicRuleDto(null, 2L, "is", "Yes", "SHOW_QUESTION", 4L));
        } else {
            title = "Clinical Trial General Intake Questionnaire";
            description = "Standard protocol intake questionnaire generated for: " + request.prompt();
            sections.add(new SectionDto(null, "Protocol Overview", "General participant inquiries", 0));
            sections.add(new SectionDto(null, "Feedback & Outcomes", "Outcomes assessment", 1));

            questions.add(new QuestionDto(1L, 0L, 0, "Single Choice", "How would you describe your overall health status?", null, true, List.of("Excellent", "Good", "Fair", "Poor")));
            questions.add(new QuestionDto(2L, 0L, 1, "Rating", "On a scale of 1 to 10, how satisfied are you with the study treatment so far?", null, true, List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10")));
            questions.add(new QuestionDto(3L, 1L, 2, "Yes / No", "Do you have any specific concerns to share with the research team?", null, true, List.of("Yes", "No")));
            questions.add(new QuestionDto(4L, 1L, 3, "Paragraph", "Please elaborate on your questions or concerns:", null, false, List.of()));

            logicRules.add(new LogicRuleDto(null, 3L, "is", "Yes", "SHOW_QUESTION", 4L));
        }

        return new AiGenerateResponse(title, description, sections, questions, logicRules);
    }

    public AiLogicSuggestionResponse suggestLogic(AiLogicSuggestionRequest request) {
        List<LogicRuleDto> suggestions = new ArrayList<>();
        if (request.questions() == null || request.questions().size() < 2) {
            return new AiLogicSuggestionResponse(suggestions);
        }

        for (int i = 0; i < request.questions().size() - 1; i++) {
            QuestionDto trigger = request.questions().get(i);
            QuestionDto next = request.questions().get(i + 1);

            if ("Yes / No".equalsIgnoreCase(trigger.type()) && ("Paragraph".equalsIgnoreCase(next.type()) || "Dropdown".equalsIgnoreCase(next.type()))) {
                suggestions.add(new LogicRuleDto(
                        null,
                        trigger.id() != null ? trigger.id() : (long) i,
                        "is",
                        "Yes",
                        "SHOW_QUESTION",
                        next.id() != null ? next.id() : (long) (i + 1)
                ));
            } else if ("Single Choice".equalsIgnoreCase(trigger.type()) && trigger.options() != null && trigger.options().contains("Other")) {
                if ("Paragraph".equalsIgnoreCase(next.type()) || "Short Text".equalsIgnoreCase(next.type())) {
                    suggestions.add(new LogicRuleDto(
                            null,
                            trigger.id() != null ? trigger.id() : (long) i,
                            "is",
                            "Other",
                            "SHOW_QUESTION",
                            next.id() != null ? next.id() : (long) (i + 1)
                    ));
                }
            }
        }

        return new AiLogicSuggestionResponse(suggestions);
    }

    public AiResponseAssessmentDto assessResponse(Long responseId) {
        SurveyResponse response = responseRepository.findById(responseId)
                .orElseThrow(() -> new ResourceNotFoundException("Response not found with ID: " + responseId));

        List<String> clinicalFlags = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        int ratingSum = 0;
        int ratingCount = 0;
        boolean hasAdverseMention = false;

        for (SurveyResponseAnswer a : response.getAnswers()) {
            String val = a.getValue() != null ? a.getValue().toLowerCase() : "";
            if (val.contains("chest") || val.contains("pain") || val.contains("severe") || val.contains("shortness of breath")) {
                hasAdverseMention = true;
                clinicalFlags.add("Potential adverse symptom reported: " + (a.getQuestion() != null ? a.getQuestion().getText() : ""));
            }
            if (a.getQuestion() != null && "Rating".equalsIgnoreCase(a.getQuestion().getType())) {
                try {
                    String clean = a.getValue().replace("\"", "");
                    ratingSum += Integer.parseInt(clean);
                    ratingCount++;
                } catch (Exception ignored) {}
            }
        }

        String sentiment = "NEUTRAL";
        if (hasAdverseMention) {
            sentiment = "CONCERN / ADVERSE RISK";
            recommendations.add("Schedule immediate follow-up interview with Site Principal Investigator.");
            recommendations.add("Verify concomitant medication log.");
        } else if (ratingCount > 0 && ((double) ratingSum / ratingCount) >= 7.5) {
            sentiment = "POSITIVE / HIGH ADHERENCE";
            recommendations.add("Continue routine study monitoring cycle.");
        } else {
            sentiment = "SATISFACTORY";
            recommendations.add("Proceed with next scheduled protocol visit.");
        }

        String summary = "Automated AI assessment for Participant Submission (ID: " + response.getId() + "). "
                + "Completed " + response.getAnswers().size() + " response items with " + sentiment + " indicator.";

        return new AiResponseAssessmentDto(
                response.getId(),
                summary,
                sentiment,
                clinicalFlags,
                recommendations
        );
    }
}
