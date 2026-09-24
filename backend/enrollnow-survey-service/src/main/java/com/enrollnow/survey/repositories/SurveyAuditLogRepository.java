package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.SurveyAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyAuditLogRepository extends JpaRepository<SurveyAuditLog, Long> {
    List<SurveyAuditLog> findBySurveyIdOrderByCreatedAtDesc(Long surveyId);
}
