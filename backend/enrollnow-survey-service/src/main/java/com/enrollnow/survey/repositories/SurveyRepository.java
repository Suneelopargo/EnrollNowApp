package com.enrollnow.survey.repositories;

import com.enrollnow.survey.models.Survey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Long> {

    Optional<Survey> findBySurveyCode(String surveyCode);

    Optional<Survey> findByPublicToken(String publicToken);

    List<Survey> findAllByOrderByCreatedAtDesc();

    List<Survey> findByStatusOrderByCreatedAtDesc(String status);

    List<Survey> findByStudyIdOrderByCreatedAtDesc(Long studyId);

    @Query("SELECT s FROM Survey s WHERE LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.surveyCode) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY s.createdAt DESC")
    List<Survey> searchSurveys(@Param("search") String search);

    long countByStatus(String status);
}
