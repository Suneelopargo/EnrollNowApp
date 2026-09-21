package com.enrollnow.participant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.participant", "com.enrollnow.common"})
public class ParticipantServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ParticipantServiceApplication.class, args);
    }
}
