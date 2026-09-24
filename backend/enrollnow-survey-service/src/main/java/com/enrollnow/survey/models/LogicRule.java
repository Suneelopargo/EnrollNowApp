package com.enrollnow.survey.models;

import jakarta.persistence.*;

@Entity
@Table(name = "logic_rules")
public class LogicRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "if_question_id", nullable = false)
    private Question ifQuestion;

    @Column(nullable = false, length = 30)
    private String condition = "is";

    @Column(nullable = false, length = 255)
    private String value;

    @Column(name = "then_action", nullable = false, length = 30)
    private String thenAction = "SHOW_QUESTION";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "then_question_id")
    private Question thenQuestion;

    public LogicRule() {}

    public LogicRule(Survey survey, Question ifQuestion, String condition, String value, String thenAction, Question thenQuestion) {
        this.survey = survey;
        this.ifQuestion = ifQuestion;
        this.condition = condition;
        this.value = value;
        this.thenAction = thenAction;
        this.thenQuestion = thenQuestion;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }

    public Question getIfQuestion() { return ifQuestion; }
    public void setIfQuestion(Question ifQuestion) { this.ifQuestion = ifQuestion; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getThenAction() { return thenAction; }
    public void setThenAction(String thenAction) { this.thenAction = thenAction; }

    public Question getThenQuestion() { return thenQuestion; }
    public void setThenQuestion(Question thenQuestion) { this.thenQuestion = thenQuestion; }
}
