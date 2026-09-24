package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.SurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {
    List<SurveyResponse> findBySurveyIdOrderByStartedAtDesc(Long surveyId);
    List<SurveyResponse> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<SurveyResponse> findBySurveyIdAndSessionToken(Long surveyId, String sessionToken);
    long countBySurveyId(Long surveyId);
    long countBySurveyIdAndStatus(Long surveyId, String status);

    @Query("SELECT r FROM SurveyResponse r WHERE r.survey.id = :surveyId ORDER BY r.id ASC")
    List<SurveyResponse> findBySurveyIdForExport(@Param("surveyId") Long surveyId);
}
