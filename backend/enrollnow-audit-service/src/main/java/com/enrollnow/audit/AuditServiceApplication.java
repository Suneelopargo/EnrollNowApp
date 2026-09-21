package com.enrollnow.audit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.audit", "com.enrollnow.common"})
public class AuditServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuditServiceApplication.class, args);
    }
}
