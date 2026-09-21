package com.enrollnow.recruitment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.recruitment", "com.enrollnow.common"})
public class RecruitmentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RecruitmentServiceApplication.class, args);
    }
}
