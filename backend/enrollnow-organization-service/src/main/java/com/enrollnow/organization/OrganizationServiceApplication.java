package com.enrollnow.organization;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.organization", "com.enrollnow.common"})
public class OrganizationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrganizationServiceApplication.class, args);
    }
}
