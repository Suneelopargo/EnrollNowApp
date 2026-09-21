package com.enrollnow.document;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.enrollnow.document", "com.enrollnow.common"})
public class DocumentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DocumentServiceApplication.class, args);
    }
}
