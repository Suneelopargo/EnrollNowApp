package com.enrollnow.task;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.task", "com.enrollnow.common"})
public class TaskServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskServiceApplication.class, args);
    }
}
