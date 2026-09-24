package com.enrollnow.survey.services;

import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.survey.dto.SurveyDtos.*;
import com.enrollnow.survey.exceptions.SurveyExceptions.*;
import com.enrollnow.survey.models.*;
import com.enrollnow.survey.repositories.QuestionRepository;
import com.enrollnow.survey.repositories.SurveyRepository;
import com.enrollnow.survey.repositories.SurveyResponseAnswerRepository;
import com.enrollnow.survey.repositories.SurveyResponseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SurveyResponseService {

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository responseRepository;
    private final SurveyResponseAnswerRepository answerRepository;
    private final ObjectMapper objectMapper;

    public SurveyResponseService(
            SurveyRepository surveyRepository,
            SurveyResponseRepository responseRepository,
            SurveyResponseAnswerRepository answerRepository,
            ObjectMapper objectMapper) {
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
        this.answerRepository = answerRepository;
        this.objectMapper = objectMapper;
    }

    public SurveyResponseDto submitResponse(
            String publicToken,
            SubmitResponseRequest request,
            UserPrincipal currentUser,
            String clientIp) {

        Survey survey = surveyRepository.findByPublicToken(publicToken)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with token: " + publicToken));

        if (!"PUBLISHED".equalsIgnoreCase(survey.getStatus())) {
            throw new ForbiddenException("Survey is currently not accepting submissions (Status: " + survey.getStatus() + ")");
        }

        String sessionToken = currentUser != null ? "usr_" + currentUser.getId() : (clientIp != null ? clientIp : "anon_" + UUID.randomUUID());

        if (!survey.isAllowMultipleResponses()) {
            Optional<SurveyResponse> existing = responseRepository.findBySurveyIdAndSessionToken(survey.getId(), sessionToken);
            if (existing.isPresent()) {
                throw new ConflictException("A response has already been submitted for this survey session");
            }
        }

        Map<Long, Question> questionMap = survey.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        Map<Long, Object> answersMap = new HashMap<>();
        if (request.answers() != null) {
            for (AnswerItemRequest item : request.answers()) {
                if (item.questionId() != null && item.value() != null) {
                    answersMap.put(item.questionId(), item.value());
                }
            }
        }

        Set<Long> hiddenQuestionIds = new HashSet<>();
        List<LogicRule> rules = survey.getLogicRules();
        if (rules != null && !rules.isEmpty()) {
            for (int pass = 0; pass < rules.size() + 1; pass++) {
                boolean changed = false;
                for (LogicRule rule : rules) {
                    if (rule.getIfQuestion() == null || rule.getThenQuestion() == null) continue;
                    Long ifQId = rule.getIfQuestion().getId();
                    Long thenQId = rule.getThenQuestion().getId();

                    Object rawTrigger = answersMap.get(ifQId);
                    String triggerStr = rawTrigger != null ? String.valueOf(rawTrigger).trim() : "";

                    boolean targetVisible;
                    if ("is".equalsIgnoreCase(rule.getCondition())) {
                        targetVisible = triggerStr.equalsIgnoreCase(rule.getValue().trim());
                    } else {
                        targetVisible = !triggerStr.equalsIgnoreCase(rule.getValue().trim());
                    }

                    if (!targetVisible && !hiddenQuestionIds.contains(thenQId)) {
                        hiddenQuestionIds.add(thenQId);
                        answersMap.remove(thenQId);
                        changed = true;
                    }
                }
                if (!changed) break;
            }
        }

        for (Question q : survey.getQuestions()) {
            if (q.isRequired() && !hiddenQuestionIds.contains(q.getId())) {
                Object val = answersMap.get(q.getId());
                boolean isMissing = val == null ||
                        (val instanceof String s && s.trim().isEmpty()) ||
                        (val instanceof List<?> list && list.isEmpty());
                if (isMissing) {
                    throw new ValidationException("Question '" + q.getText() + "' is required");
                }
            }
        }

        SurveyResponse response = new SurveyResponse();
        response.setSurvey(survey);
        response.setSurveyVersion(!survey.getVersions().isEmpty() ? survey.getVersions().get(survey.getVersions().size() - 1) : null);
        response.setStudyId(request.studyId() != null ? request.studyId() : survey.getStudyId());
        response.setParticipantId(request.participantId());
        response.setUserId(currentUser != null ? currentUser.getId() : null);
        response.setUserEmail(request.userEmail() != null ? request.userEmail() : (currentUser != null ? currentUser.getUsername() : null));
        response.setSubmissionType(currentUser != null ? "AUTHENTICATED" : "EXTERNAL");
        response.setStatus("COMPLETED");
        response.setSessionToken(sessionToken);
        response.setStartedAt(OffsetDateTime.now());
        response.setCompletedAt(OffsetDateTime.now());

        SurveyResponse savedResponse = responseRepository.save(response);

        List<SurveyResponseAnswer> answerList = new ArrayList<>();
        for (Map.Entry<Long, Object> entry : answersMap.entrySet()) {
            Long qId = entry.getKey();
            Question question = questionMap.get(qId);
            if (question != null) {
                String valueStr = "";
                try {
                    valueStr = objectMapper.writeValueAsString(entry.getValue());
                } catch (Exception e) {
                    valueStr = String.valueOf(entry.getValue());
                }
                SurveyResponseAnswer answer = new SurveyResponseAnswer(savedResponse, question, valueStr);
                answerList.add(answerRepository.save(answer));
            }
        }
        savedResponse.setAnswers(answerList);

        return toDto(savedResponse);
    }

    @Transactional(readOnly = true)
    public List<SurveyResponseDto> getResponsesBySurveyId(Long surveyId) {
        if (!surveyRepository.existsById(surveyId)) {
            throw new ResourceNotFoundException("Survey not found with ID: " + surveyId);
        }
        List<SurveyResponse> responses = responseRepository.findBySurveyIdOrderByStartedAtDesc(surveyId);
        return responses.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SurveyResponseDto> getMyResponses(Long userId) {
        List<SurveyResponse> responses = responseRepository.findByUserIdOrderByStartedAtDesc(userId);
        return responses.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SurveyResponseDto getResponseById(Long responseId) {
        SurveyResponse response = responseRepository.findById(responseId)
                .orElseThrow(() -> new ResourceNotFoundException("Response not found with ID: " + responseId));
        return toDto(response);
    }

    private SurveyResponseDto toDto(SurveyResponse r) {
        List<AnswerItemResponse> answers = r.getAnswers().stream()
                .map(a -> {
                    Object parsedVal = a.getValue();
                    try {
                        parsedVal = objectMapper.readValue(a.getValue(), Object.class);
                    } catch (Exception ignored) {}
                    return new AnswerItemResponse(
                            a.getId(),
                            a.getQuestion() != null ? a.getQuestion().getId() : null,
                            a.getQuestion() != null ? a.getQuestion().getText() : null,
                            parsedVal
                    );
                }).collect(Collectors.toList());

        return new SurveyResponseDto(
                r.getId(),
                r.getSurvey() != null ? r.getSurvey().getId() : null,
                r.getSurvey() != null ? r.getSurvey().getTitle() : null,
                r.getUserId(),
                r.getUserEmail(),
                r.getStatus(),
                r.getSessionToken(),
                r.getStartedAt(),
                r.getCompletedAt(),
                answers
        );
    }
}
