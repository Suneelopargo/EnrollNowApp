package com.enrollnow.survey.models;

import jakarta.persistence.*;

@Entity
@Table(name = "survey_sections")
public class SurveySection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description = "";

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    public SurveySection() {}

    public SurveySection(Survey survey, String title, String description, int displayOrder) {
        this.survey = survey;
        this.title = title;
        this.description = description;
        this.displayOrder = displayOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    public int getPosition() { return displayOrder; }
    public void setPosition(int position) { this.displayOrder = position; }
}
