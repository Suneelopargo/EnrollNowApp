package com.enrollnow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication(
    scanBasePackages = "com.enrollnow",
    exclude = UserDetailsServiceAutoConfiguration.class
)
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class EnrollNowApplication {

    public static void main(String[] args) {
        SpringApplication.run(EnrollNowApplication.class, args);
    }
}