package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.SurveySection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveySectionRepository extends JpaRepository<SurveySection, Long> {
    List<SurveySection> findBySurveyIdOrderByDisplayOrderAsc(Long surveyId);
    void deleteBySurveyId(Long surveyId);
}
