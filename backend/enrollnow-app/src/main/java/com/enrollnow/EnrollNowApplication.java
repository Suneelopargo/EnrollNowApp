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

        String dbPassword = System.getenv("DB_PASSWORD");

        System.out.println("DB_PASSWORD present: " + (dbPassword != null));
        System.out.println("DB_PASSWORD length: " +
                (dbPassword != null ? dbPassword.length() : 0));

        SpringApplication.run(EnrollNowApplication.class, args);
    }
}