package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.LogicRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogicRuleRepository extends JpaRepository<LogicRule, Long> {
    List<LogicRule> findBySurveyId(Long surveyId);
    void deleteBySurveyId(Long surveyId);
}
