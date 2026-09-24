package com.enrollnow.survey.models;

import jakarta.persistence.*;

@Entity
@Table(name = "response_answers")
public class SurveyResponseAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    private SurveyResponse response;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(columnDefinition = "TEXT")
    private String value = "";

    public SurveyResponseAnswer() {}

    public SurveyResponseAnswer(SurveyResponse response, Question question, String value) {
        this.response = response;
        this.question = question;
        this.value = value;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SurveyResponse getResponse() { return response; }
    public void setResponse(SurveyResponse response) { this.response = response; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
