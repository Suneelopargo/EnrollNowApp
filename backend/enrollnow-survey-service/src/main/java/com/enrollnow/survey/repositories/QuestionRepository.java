package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySurveyIdOrderByDisplayOrderAsc(Long surveyId);
    void deleteBySurveyId(Long surveyId);
}
