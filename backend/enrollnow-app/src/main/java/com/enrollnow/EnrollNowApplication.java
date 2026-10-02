package com.enrollnow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(
    scanBasePackages = "com.enrollnow",
    exclude = UserDetailsServiceAutoConfiguration.class
)
public class EnrollNowApplication {

    public static void main(String[] args) {
        SpringApplication.run(EnrollNowApplication.class, args);
    }
}