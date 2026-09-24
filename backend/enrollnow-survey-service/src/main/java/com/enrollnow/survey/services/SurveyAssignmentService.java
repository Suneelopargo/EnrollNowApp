package com.enrollnow.survey.services;

import com.enrollnow.survey.dto.SurveyDtos.*;
import com.enrollnow.survey.exceptions.SurveyExceptions.*;
import com.enrollnow.survey.models.Survey;
import com.enrollnow.survey.models.SurveyAssignment;
import com.enrollnow.survey.repositories.SurveyAssignmentRepository;
import com.enrollnow.survey.repositories.SurveyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SurveyAssignmentService {

    private final SurveyAssignmentRepository assignmentRepository;
    private final SurveyRepository surveyRepository;

    public SurveyAssignmentService(SurveyAssignmentRepository assignmentRepository, SurveyRepository surveyRepository) {
        this.assignmentRepository = assignmentRepository;
        this.surveyRepository = surveyRepository;
    }

    @Transactional(readOnly = true)
    public List<SurveyAssignmentDto> listAssignments(Long surveyId) {
        List<SurveyAssignment> assignments;
        if (surveyId != null) {
            assignments = assignmentRepository.findBySurveyIdOrderByAssignedAtDesc(surveyId);
        } else {
            assignments = assignmentRepository.findAll();
        }
        return assignments.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SurveyAssignmentDto> getMyAssignedSurveys(Long userId) {
        List<SurveyAssignment> assignments = assignmentRepository.findByUserIdOrderByAssignedAtDesc(userId);
        return assignments.stream().map(this::toDto).collect(Collectors.toList());
    }

    public SurveyAssignmentDto assignSurvey(CreateAssignmentRequest request) {
        Survey survey = surveyRepository.findById(request.surveyId())
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with ID: " + request.surveyId()));

        if (assignmentRepository.existsByUserIdAndSurveyId(request.userId(), request.surveyId())) {
            throw new ConflictException("User is already assigned to this survey");
        }

        SurveyAssignment assignment = new SurveyAssignment(request.userId(), survey);
        SurveyAssignment saved = assignmentRepository.save(assignment);
        return toDto(saved);
    }

    public void unassignSurvey(Long assignmentId) {
        SurveyAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + assignmentId));
        assignmentRepository.delete(assignment);
    }

    private SurveyAssignmentDto toDto(SurveyAssignment a) {
        return new SurveyAssignmentDto(
                a.getId(),
                a.getUserId(),
                a.getSurvey() != null ? a.getSurvey().getId() : null,
                a.getSurvey() != null ? a.getSurvey().getSurveyCode() : null,
                a.getSurvey() != null ? a.getSurvey().getTitle() : null,
                a.getStatus(),
                a.getSurvey() != null ? a.getSurvey().getPublicToken() : null,
                a.getAssignedAt()
        );
    }
}
