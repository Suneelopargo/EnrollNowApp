package com.enrollnow.survey.services;

import com.enrollnow.survey.dto.SurveyDtos.*;
import com.enrollnow.survey.exceptions.SurveyExceptions.ResourceNotFoundException;
import com.enrollnow.survey.models.Survey;
import com.enrollnow.survey.models.SurveyResponse;
import com.enrollnow.survey.models.SurveyResponseAnswer;
import com.enrollnow.survey.repositories.SurveyRepository;
import com.enrollnow.survey.repositories.SurveyResponseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SurveyAnalyticsService {

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository responseRepository;
    private final ObjectMapper objectMapper;

    public SurveyAnalyticsService(
            SurveyRepository surveyRepository,
            SurveyResponseRepository responseRepository,
            ObjectMapper objectMapper) {
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
        this.objectMapper = objectMapper;
    }

    public SurveyDashboardDto getDashboard() {
        List<Survey> surveys = surveyRepository.findAllByOrderByCreatedAtDesc();
        long totalSurveys = surveys.size();
        long draftSurveys = surveys.stream().filter(s -> "DRAFT".equalsIgnoreCase(s.getStatus())).count();
        long publishedSurveys = surveys.stream().filter(s -> "PUBLISHED".equalsIgnoreCase(s.getStatus())).count();

        List<SurveyResponse> allResponses = responseRepository.findAll();
        long totalResponses = allResponses.size();
        long completedResponses = allResponses.stream().filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus())).count();
        double completionRate = totalResponses > 0 ? Math.round((double) completedResponses / totalResponses * 1000.0) / 10.0 : 0.0;

        List<SurveyListItemDto> recentSurveys = surveys.stream().limit(5).map(s -> new SurveyListItemDto(
                s.getId(),
                s.getSurveyCode(),
                s.getStudyId(),
                s.getTitle(),
                s.getDescription(),
                s.getStatus(),
                s.getPublicToken(),
                s.getQuestions().size(),
                s.getSections().size(),
                responseRepository.countBySurveyId(s.getId()),
                s.getCreatedAt(),
                s.getUpdatedAt()
        )).collect(Collectors.toList());

        Map<String, List<String>> dailyRespondents = new TreeMap<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (SurveyResponse r : allResponses) {
            LocalDate date = (r.getCompletedAt() != null ? r.getCompletedAt() : r.getStartedAt()).toLocalDate();
            String dateStr = date.format(dtf);
            dailyRespondents.computeIfAbsent(dateStr, k -> new ArrayList<>())
                    .add(r.getUserEmail() != null ? r.getUserEmail() : "Anonymous Participant");
        }

        List<DailyResponseStat> responsesByDay = dailyRespondents.entrySet().stream()
                .map(e -> new DailyResponseStat(e.getKey(), e.getValue().size(), e.getValue()))
                .collect(Collectors.toList());

        return new SurveyDashboardDto(
                totalSurveys,
                draftSurveys,
                publishedSurveys,
                totalResponses,
                completionRate,
                recentSurveys,
                responsesByDay
        );
    }

    public SurveyAnalyticsDto getSurveyAnalytics(Long surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + surveyId));

        List<SurveyResponse> responses = responseRepository.findBySurveyIdOrderByStartedAtDesc(surveyId);
        long total = responses.size();
        long completed = responses.stream().filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus())).count();
        double completionRate = total > 0 ? Math.round((double) completed / total * 1000.0) / 10.0 : 0.0;

        List<Double> ratings = new ArrayList<>();
        Map<String, List<String>> dailyMap = new TreeMap<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (SurveyResponse r : responses) {
            LocalDate date = (r.getCompletedAt() != null ? r.getCompletedAt() : r.getStartedAt()).toLocalDate();
            String dateStr = date.format(dtf);
            dailyMap.computeIfAbsent(dateStr, k -> new ArrayList<>())
                    .add(r.getUserEmail() != null ? r.getUserEmail() : "Participant");

            for (SurveyResponseAnswer a : r.getAnswers()) {
                if (a.getQuestion() != null && "Rating".equalsIgnoreCase(a.getQuestion().getType())) {
                    try {
                        String raw = a.getValue();
                        if (raw.startsWith("\"") && raw.endsWith("\"")) {
                            raw = raw.substring(1, raw.length() - 1);
                        }
                        double val = Double.parseDouble(raw);
                        ratings.add(val);
                    } catch (Exception ignored) {}
                }
            }
        }

        Double avgRating = ratings.isEmpty() ? null : Math.round(ratings.stream().mapToDouble(d -> d).average().orElse(0.0) * 10.0) / 10.0;

        List<DailyResponseStat> responsesByDay = dailyMap.entrySet().stream()
                .map(e -> new DailyResponseStat(e.getKey(), e.getValue().size(), e.getValue()))
                .collect(Collectors.toList());

        return new SurveyAnalyticsDto(
                survey.getId(),
                survey.getTitle(),
                total,
                completed,
                completionRate,
                avgRating,
                responsesByDay
        );
    }
}
