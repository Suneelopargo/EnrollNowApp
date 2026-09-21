package com.enrollnow.communication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.communication", "com.enrollnow.common"})
public class CommunicationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CommunicationServiceApplication.class, args);
    }
}
