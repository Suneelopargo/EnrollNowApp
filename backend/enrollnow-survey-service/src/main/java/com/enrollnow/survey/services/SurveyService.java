package com.enrollnow.survey.services;

import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.survey.dto.SurveyDtos.*;
import com.enrollnow.survey.exceptions.SurveyExceptions.*;
import com.enrollnow.survey.models.*;
import com.enrollnow.survey.repositories.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final QuestionRepository questionRepository;
    private final SurveySectionRepository sectionRepository;
    private final QuestionOptionRepository optionRepository;
    private final LogicRuleRepository logicRuleRepository;
    private final SurveyVersionRepository versionRepository;
    private final SurveyResponseRepository responseRepository;
    private final SurveyAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public SurveyService(
            SurveyRepository surveyRepository,
            QuestionRepository questionRepository,
            SurveySectionRepository sectionRepository,
            QuestionOptionRepository optionRepository,
            LogicRuleRepository logicRuleRepository,
            SurveyVersionRepository versionRepository,
            SurveyResponseRepository responseRepository,
            SurveyAuditLogRepository auditLogRepository,
            ObjectMapper objectMapper) {
        this.surveyRepository = surveyRepository;
        this.questionRepository = questionRepository;
        this.sectionRepository = sectionRepository;
        this.optionRepository = optionRepository;
        this.logicRuleRepository = logicRuleRepository;
        this.versionRepository = versionRepository;
        this.responseRepository = responseRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    public List<SurveyListItemDto> listSurveys(String search, String status) {
        List<Survey> surveys;
        if (search != null && !search.isBlank()) {
            surveys = surveyRepository.searchSurveys(search.trim());
        } else if (status != null && !status.isBlank()) {
            surveys = surveyRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        } else {
            surveys = surveyRepository.findAllByOrderByCreatedAtDesc();
        }

        return surveys.stream().map(s -> new SurveyListItemDto(
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
    }

    public SurveyDto getSurveyById(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + id));
        return toDto(survey);
    }

    public SurveyDto getSurveyByPublicToken(String publicToken) {
        Survey survey = surveyRepository.findByPublicToken(publicToken)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with token: " + publicToken));
        if (!"PUBLISHED".equalsIgnoreCase(survey.getStatus())) {
            throw new ForbiddenException("Survey is currently not published");
        }
        return toDto(survey);
    }

    public SurveyDto createSurvey(SurveyCreateRequest request, UserPrincipal currentUser) {
        Survey survey = new Survey();
        survey.setSurveyCode("SRV-" + (1000 + secureRandom.nextInt(90000)));
        survey.setTitle(request.title());
        survey.setDescription(request.description() != null ? request.description() : "");
        survey.setStudyId(request.studyId());
        survey.setStatus("DRAFT");
        survey.setAnonymousResponses(request.anonymousResponses());
        survey.setAllowMultipleResponses(request.allowMultipleResponses());
        survey.setShowProgressBar(request.showProgressBar());
        if (request.thankYouMessage() != null && !request.thankYouMessage().isBlank()) {
            survey.setThankYouMessage(request.thankYouMessage());
        }
        survey.setPublicToken("tok_" + UUID.randomUUID().toString().replace("-", ""));
        survey.setCreatedBy(currentUser != null ? currentUser.getId() : null);
        survey.setUpdatedBy(currentUser != null ? currentUser.getId() : null);

        Survey savedSurvey = surveyRepository.save(survey);

        // Save Sections
        Map<Integer, SurveySection> sectionPositionMap = new HashMap<>();
        if (request.sections() != null) {
            for (int i = 0; i < request.sections().size(); i++) {
                SectionDto secDto = request.sections().get(i);
                SurveySection sec = new SurveySection(savedSurvey, secDto.title(), secDto.description(), i);
                SurveySection savedSec = sectionRepository.save(sec);
                savedSurvey.getSections().add(savedSec);
                sectionPositionMap.put(i, savedSec);
            }
        }

        // Save Questions
        List<Question> savedQuestions = new ArrayList<>();
        if (request.questions() != null) {
            for (int i = 0; i < request.questions().size(); i++) {
                QuestionDto qDto = request.questions().get(i);
                String optionsJson = "[]";
                try {
                    optionsJson = objectMapper.writeValueAsString(qDto.options() != null ? qDto.options() : List.of());
                } catch (Exception ignored) {}

                Question q = new Question(savedSurvey, i, qDto.type(), qDto.text(), qDto.required(), optionsJson);
                q.setDescription(qDto.description());
                if (qDto.sectionId() != null && sectionPositionMap.containsKey(qDto.sectionId().intValue())) {
                    q.setSection(sectionPositionMap.get(qDto.sectionId().intValue()));
                }
                Question savedQ = questionRepository.save(q);

                // Save question options
                if (qDto.options() != null) {
                    for (int optIdx = 0; optIdx < qDto.options().size(); optIdx++) {
                        String optVal = qDto.options().get(optIdx);
                        optionRepository.save(new QuestionOption(savedQ, optVal, optVal, optIdx));
                    }
                }
                savedQuestions.add(savedQ);
                savedSurvey.getQuestions().add(savedQ);
            }
        }

        recordAudit(savedSurvey.getId(), "SURVEY_CREATED", currentUser, "Created survey draft with " + savedQuestions.size() + " questions");
        return toDto(savedSurvey);
    }

    public SurveyDto updateSurvey(Long id, SurveyUpdateRequest request, UserPrincipal currentUser) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + id));

        Map<Long, Integer> oldQuestionPositions = new HashMap<>();
        for (Question q : survey.getQuestions()) {
            oldQuestionPositions.put(q.getId(), q.getPosition());
        }

        survey.setTitle(request.title());
        survey.setDescription(request.description() != null ? request.description() : "");
        survey.setStudyId(request.studyId());
        if (request.status() != null && !request.status().isBlank()) {
            survey.setStatus(request.status());
        }
        survey.setAnonymousResponses(request.anonymousResponses());
        survey.setAllowMultipleResponses(request.allowMultipleResponses());
        survey.setShowProgressBar(request.showProgressBar());
        if (request.thankYouMessage() != null) {
            survey.setThankYouMessage(request.thankYouMessage());
        }
        survey.setUpdatedBy(currentUser != null ? currentUser.getId() : null);
        survey.setUpdatedAt(OffsetDateTime.now());

        logicRuleRepository.deleteBySurveyId(survey.getId());
        survey.getLogicRules().clear();

        for (Question q : survey.getQuestions()) {
            optionRepository.deleteByQuestionId(q.getId());
        }
        questionRepository.deleteBySurveyId(survey.getId());
        survey.getQuestions().clear();

        sectionRepository.deleteBySurveyId(survey.getId());
        survey.getSections().clear();

        surveyRepository.flush();

        Map<Integer, SurveySection> sectionPositionMap = new HashMap<>();
        if (request.sections() != null) {
            for (int i = 0; i < request.sections().size(); i++) {
                SectionDto secDto = request.sections().get(i);
                SurveySection sec = new SurveySection(survey, secDto.title(), secDto.description(), i);
                SurveySection savedSec = sectionRepository.save(sec);
                survey.getSections().add(savedSec);
                sectionPositionMap.put(i, savedSec);
            }
        }

        List<Question> newQuestions = new ArrayList<>();
        if (request.questions() != null) {
            for (int i = 0; i < request.questions().size(); i++) {
                QuestionDto qDto = request.questions().get(i);
                String optionsJson = "[]";
                try {
                    optionsJson = objectMapper.writeValueAsString(qDto.options() != null ? qDto.options() : List.of());
                } catch (Exception ignored) {}

                Question q = new Question(survey, i, qDto.type(), qDto.text(), qDto.required(), optionsJson);
                q.setDescription(qDto.description());
                if (qDto.sectionId() != null && sectionPositionMap.containsKey(qDto.sectionId().intValue())) {
                    q.setSection(sectionPositionMap.get(qDto.sectionId().intValue()));
                }
                Question savedQ = questionRepository.save(q);

                if (qDto.options() != null) {
                    for (int optIdx = 0; optIdx < qDto.options().size(); optIdx++) {
                        String optVal = qDto.options().get(optIdx);
                        optionRepository.save(new QuestionOption(savedQ, optVal, optVal, optIdx));
                    }
                }
                newQuestions.add(savedQ);
                survey.getQuestions().add(savedQ);
            }
        }

        if (request.logicRules() != null && !request.logicRules().isEmpty()) {
            for (LogicRuleDto ruleDto : request.logicRules()) {
                Question ifQuestion = null;
                Question thenQuestion = null;

                if (oldQuestionPositions.containsKey(ruleDto.ifQuestionId())) {
                    int ifPos = oldQuestionPositions.get(ruleDto.ifQuestionId());
                    if (ifPos < newQuestions.size()) {
                        ifQuestion = newQuestions.get(ifPos);
                    }
                }
                if (ruleDto.thenQuestionId() != null && oldQuestionPositions.containsKey(ruleDto.thenQuestionId())) {
                    int thenPos = oldQuestionPositions.get(ruleDto.thenQuestionId());
                    if (thenPos < newQuestions.size()) {
                        thenQuestion = newQuestions.get(thenPos);
                    }
                }

                if (ifQuestion == null && ruleDto.ifQuestionId() != null && ruleDto.ifQuestionId() < newQuestions.size()) {
                    ifQuestion = newQuestions.get(ruleDto.ifQuestionId().intValue());
                }
                if (thenQuestion == null && ruleDto.thenQuestionId() != null && ruleDto.thenQuestionId() < newQuestions.size()) {
                    thenQuestion = newQuestions.get(ruleDto.thenQuestionId().intValue());
                }

                if (ifQuestion != null && thenQuestion != null && !ifQuestion.getId().equals(thenQuestion.getId())) {
                    LogicRule rule = new LogicRule(
                            survey,
                            ifQuestion,
                            ruleDto.condition() != null ? ruleDto.condition() : "is",
                            ruleDto.value(),
                            ruleDto.thenAction() != null ? ruleDto.thenAction() : "SHOW_QUESTION",
                            thenQuestion
                    );
                    LogicRule savedRule = logicRuleRepository.save(rule);
                    survey.getLogicRules().add(savedRule);
                }
            }
        }

        Survey updated = surveyRepository.save(survey);
        recordAudit(updated.getId(), "SURVEY_UPDATED", currentUser, "Updated survey definition");
        return toDto(updated);
    }

    public SurveyDto publishSurvey(Long id, UserPrincipal currentUser) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + id));

        if (survey.getQuestions().isEmpty()) {
            throw new ValidationException("A survey must contain at least one question before it can be published");
        }

        survey.setStatus("PUBLISHED");
        survey.setUpdatedAt(OffsetDateTime.now());

        int nextVersion = survey.getVersions().size() + 1;
        String snapshotJson = "{}";
        try {
            snapshotJson = objectMapper.writeValueAsString(toDto(survey));
        } catch (Exception ignored) {}

        SurveyVersion version = new SurveyVersion(
                survey,
                nextVersion,
                snapshotJson,
                "PUBLISHED",
                currentUser != null ? currentUser.getId() : null
        );
        versionRepository.save(version);
        survey.getVersions().add(version);

        Survey saved = surveyRepository.save(survey);
        recordAudit(saved.getId(), "SURVEY_PUBLISHED", currentUser, "Published version v" + nextVersion);
        return toDto(saved);
    }

    public SurveyDto unpublishSurvey(Long id, UserPrincipal currentUser) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + id));

        survey.setStatus("DRAFT");
        survey.setUpdatedAt(OffsetDateTime.now());
        Survey saved = surveyRepository.save(survey);
        recordAudit(saved.getId(), "SURVEY_UNPUBLISHED", currentUser, "Reverted status to DRAFT");
        return toDto(saved);
    }

    public SurveyDto archiveSurvey(Long id, UserPrincipal currentUser) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + id));

        survey.setStatus("ARCHIVED");
        survey.setUpdatedAt(OffsetDateTime.now());
        Survey saved = surveyRepository.save(survey);
        recordAudit(saved.getId(), "SURVEY_ARCHIVED", currentUser, "Archived survey instrument");
        return toDto(saved);
    }

    public void deleteSurvey(Long id, UserPrincipal currentUser) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + id));
        recordAudit(survey.getId(), "SURVEY_DELETED", currentUser, "Permanently deleted survey: " + survey.getTitle());
        surveyRepository.delete(survey);
    }

    private void recordAudit(Long surveyId, String action, UserPrincipal user, String details) {
        SurveyAuditLog log = new SurveyAuditLog(
                surveyId,
                action,
                user != null ? user.getId() : null,
                user != null ? user.getUsername() : "ANONYMOUS",
                null,
                null,
                "{\"message\": \"" + details + "\"}"
        );
        auditLogRepository.save(log);
    }

    public SurveyDto toDto(Survey s) {
        List<SectionDto> sectionDtos = s.getSections().stream()
                .map(sec -> new SectionDto(sec.getId(), sec.getTitle(), sec.getDescription(), sec.getPosition()))
                .collect(Collectors.toList());

        List<QuestionDto> questionDtos = s.getQuestions().stream()
                .map(q -> {
                    List<String> options = new ArrayList<>();
                    if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                        options = q.getOptions().stream().map(QuestionOption::getLabel).collect(Collectors.toList());
                    } else if (q.getOptionsJson() != null && !q.getOptionsJson().isBlank()) {
                        try {
                            options = objectMapper.readValue(q.getOptionsJson(), List.class);
                        } catch (Exception ignored) {}
                    }
                    return new QuestionDto(
                            q.getId(),
                            q.getSection() != null ? q.getSection().getId() : null,
                            q.getPosition(),
                            q.getType(),
                            q.getText(),
                            q.getDescription(),
                            q.isRequired(),
                            options
                    );
                }).collect(Collectors.toList());

        List<LogicRuleDto> logicRuleDtos = s.getLogicRules().stream()
                .map(r -> new LogicRuleDto(
                        r.getId(),
                        r.getIfQuestion() != null ? r.getIfQuestion().getId() : null,
                        r.getCondition(),
                        r.getValue(),
                        r.getThenAction(),
                        r.getThenQuestion() != null ? r.getThenQuestion().getId() : null
                )).collect(Collectors.toList());

        return new SurveyDto(
                s.getId(),
                s.getSurveyCode(),
                s.getStudyId(),
                s.getTitle(),
                s.getDescription(),
                s.getStatus(),
                s.isAnonymousResponses(),
                s.isAllowMultipleResponses(),
                s.isShowProgressBar(),
                s.getThankYouMessage(),
                s.isGlobalSubmission(),
                s.isTriggerEmailNotification(),
                s.isEnableEconsentCountersign(),
                s.isRequireRecaptcha(),
                s.getPublicToken(),
                s.getCreatedAt(),
                s.getUpdatedAt(),
                sectionDtos,
                questionDtos,
                logicRuleDtos,
                s.getVersions() != null ? s.getVersions().size() : 0,
                responseRepository.countBySurveyId(s.getId())
        );
    }
}
