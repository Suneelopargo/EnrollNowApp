package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.SurveyResponseAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyResponseAnswerRepository extends JpaRepository<SurveyResponseAnswer, Long> {
    List<SurveyResponseAnswer> findByResponseId(Long responseId);
}
