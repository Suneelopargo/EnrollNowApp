package com.enrollnow.survey.services;

import com.enrollnow.survey.exceptions.SurveyExceptions.ResourceNotFoundException;
import com.enrollnow.survey.models.Question;
import com.enrollnow.survey.models.Survey;
import com.enrollnow.survey.models.SurveyResponse;
import com.enrollnow.survey.models.SurveyResponseAnswer;
import com.enrollnow.survey.repositories.SurveyRepository;
import com.enrollnow.survey.repositories.SurveyResponseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class SurveyExportService {

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository responseRepository;
    private final ObjectMapper objectMapper;

    public SurveyExportService(
            SurveyRepository surveyRepository,
            SurveyResponseRepository responseRepository,
            ObjectMapper objectMapper) {
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
        this.objectMapper = objectMapper;
    }

    public byte[] exportResponsesCsv(Long surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + surveyId));

        List<Question> questions = survey.getQuestions();
        List<SurveyResponse> responses = responseRepository.findBySurveyIdForExport(surveyId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8);

        StringBuilder header = new StringBuilder("Response ID,Date,Status,Respondent Email,Submission Type");
        for (Question q : questions) {
            header.append(",\"").append(q.getText().replace("\"", "\"\"")).append("\"");
        }
        writer.println(header);

        DateTimeFormatter dtf = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
        for (SurveyResponse r : responses) {
            Map<Long, String> answerMap = new HashMap<>();
            for (SurveyResponseAnswer a : r.getAnswers()) {
                if (a.getQuestion() != null) {
                    String val = a.getValue();
                    try {
                        Object parsed = objectMapper.readValue(val, Object.class);
                        val = String.valueOf(parsed);
                    } catch (Exception ignored) {}
                    answerMap.put(a.getQuestion().getId(), val);
                }
            }

            StringBuilder row = new StringBuilder();
            row.append(r.getId()).append(",");
            row.append(r.getCompletedAt() != null ? r.getCompletedAt().format(dtf) : r.getStartedAt().format(dtf)).append(",");
            row.append(r.getStatus()).append(",");
            row.append("\"").append(r.getUserEmail() != null ? r.getUserEmail().replace("\"", "\"\"") : "").append("\",");
            row.append(r.getSubmissionType());

            for (Question q : questions) {
                String val = answerMap.getOrDefault(q.getId(), "");
                row.append(",\"").append(val.replace("\"", "\"\"")).append("\"");
            }
            writer.println(row);
        }

        writer.flush();
        return out.toByteArray();
    }
}
