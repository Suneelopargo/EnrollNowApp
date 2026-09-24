package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.SurveyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyAssignmentRepository extends JpaRepository<SurveyAssignment, Long> {
    List<SurveyAssignment> findByUserIdOrderByAssignedAtDesc(Long userId);
    List<SurveyAssignment> findBySurveyIdOrderByAssignedAtDesc(Long surveyId);
    Optional<SurveyAssignment> findByUserIdAndSurveyId(Long userId, Long surveyId);
    boolean existsByUserIdAndSurveyId(Long userId, Long surveyId);
}
