package com.enrollnow.survey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.survey", "com.enrollnow.common"})
public class SurveyServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(SurveyServiceApplication.class, args);
    }
}
