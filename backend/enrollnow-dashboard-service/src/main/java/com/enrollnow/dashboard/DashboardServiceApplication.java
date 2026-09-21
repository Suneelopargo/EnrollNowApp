package com.enrollnow.dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.dashboard", "com.enrollnow.common"})
public class DashboardServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DashboardServiceApplication.class, args);
    }
}
