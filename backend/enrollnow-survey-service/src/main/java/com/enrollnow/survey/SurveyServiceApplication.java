package com.enrollnow.survey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.survey", "com.enrollnow.common"})
@EntityScan(basePackages = {"com.enrollnow.survey.models"})
@EnableJpaRepositories(basePackages = {"com.enrollnow.survey.repositories"})
public class SurveyServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(SurveyServiceApplication.class, args);
    }
}
