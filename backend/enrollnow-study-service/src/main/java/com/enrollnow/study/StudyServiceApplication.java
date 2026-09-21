package com.enrollnow.study;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.study", "com.enrollnow.common"})
public class StudyServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudyServiceApplication.class, args);
    }
}
