package com.enrollnow.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.admin", "com.enrollnow.common"})
public class AdministrationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdministrationServiceApplication.class, args);
    }
}
