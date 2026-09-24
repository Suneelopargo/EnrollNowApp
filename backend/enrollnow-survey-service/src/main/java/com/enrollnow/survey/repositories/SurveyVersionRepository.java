package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.SurveyVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyVersionRepository extends JpaRepository<SurveyVersion, Long> {
    List<SurveyVersion> findBySurveyIdOrderByVersionNumberDesc(Long surveyId);
    Optional<SurveyVersion> findBySurveyIdAndVersionNumber(Long surveyId, int versionNumber);
}
